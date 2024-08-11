import { RoleOutput, RolePermission } from '@prisma/client';
import { PERMISSION_ROLE_EDIT, PERMISSION_USER_EDIT, PERMISSION_VIDEOHUB_EDIT, PERMISSION_VIDEOHUB_SCENES_EDIT, PERMISSION_VIDEOHUB_SCENES_SCHEDULE, TOGGLEABLE_PERMISSIONS } from '../authentification/permissions';
import { getPrisma } from './prismadb';
import cache from 'global-cache';
import { getVideohubs, setupVideohubs } from './videohubs';
import { IRole } from '../authentification/interfaces';

interface UserNameCreation {
    username: string,
    password: string,
}

export class Role implements IRole {
    id: number;
    editable: boolean;
    name: string;
    rolePermissions: RolePermission[] = []
    permissions: string[];
    outputs: RoleOutput[];
    permissionsSet: Set<string> = new Set<string>;

    constructor(id: number, editable: boolean, name: string, permissions: string[], outputs: RoleOutput[]) {
        this.id = id;
        this.name = name;
        this.editable = editable;
        this.outputs = outputs;
        this.permissions = permissions;

        this.setPermissions(permissions.map(perm => {
            return {
                permission: perm,
                role_id: id,
            }
        }))
    }

    setPermissions(permissions: RolePermission[]) {
        this.rolePermissions = permissions;
        this.permissions = permissions.map(perm => perm.permission);
        this.permissionsSet = new Set(this.permissions);
    }

    hasPermission(permission: string): boolean {
        return this.permissionsSet.has(permission);
    }
}

async function createUser(user: UserNameCreation, role: Role | undefined) {
    if (await getPrisma().user.findUnique({
        where: {
            username: user.username,
        }
    }) == undefined) {
        console.log(`Creating user: ${user.username}`)
        if (user.password == undefined || user.username == undefined || user.password === "") {
            console.log(`Invalid user creation: ${user.username}`);
        } else {
            await getPrisma().user.create({
                data: {
                    username: user.username,
                    password: user.password,
                    role_id: role?.id,
                }
            });
        }
    }
}


export const ROLE_ADMIN_ID: number = 1;
export async function setupRoles() {
    console.log("Setting up roles...")
    const roles = new Map();
    cache.set("roles", roles);

    // load created roles
    const customRoles = await getPrisma().role.findMany({
        include: {
            permissions: true,
            outputs: true,
        }
    })

    for (const role of customRoles) {
        addRole(role)
    }

    const adminRole = new Role(ROLE_ADMIN_ID, false, "Admin", [PERMISSION_VIDEOHUB_EDIT, PERMISSION_VIDEOHUB_SCENES_SCHEDULE, PERMISSION_VIDEOHUB_SCENES_EDIT, PERMISSION_ROLE_EDIT, PERMISSION_USER_EDIT], [])
    roles.set(adminRole.id, adminRole) // override

    // create necesarry roles
    for (const role of [adminRole]) {
        // if not editable, then override
        if (roles.get(role.id) == undefined || !role.editable) {
            roles.set(role.id, role)

            await getPrisma().role.upsert({
                where: {
                    id: role.id,
                },
                create: {
                    id: role.id,
                    name: role.name,
                    editable: role.editable,
                },
                update: {
                    name: role.name,
                    editable: role.editable, // disallow manual manipulation
                },
            })

            await setRolePermissions(role.id, role.rolePermissions, true)
        }
    }

    await createUser({ username: "Admin", password: process.env.ADMIN_PASSWORD || "" }, roles.get(1));
    const add = JSON.parse(process.env.USERS_ADD || "[]");
    for (const user of add) {
        const userCreation: UserNameCreation = user;
        await createUser(userCreation, undefined);
    }

    console.log("Roles setup.");
}

export function getRoles(): Map<number, Role> {
    const roles: any = cache.get("roles");
    return roles;
}

export function getRoleById(id: number): Role | undefined {
    return getRoles().get(id);
}

export function removeRole(id: number): boolean {
    const role = getRoleById(id)
    if (role == undefined || !role.editable) {
        return false;
    }

    return getRoles().delete(id);
}

export async function setRolePermissions(roleId: number, perms: RolePermission[], allowNonEditable: boolean): Promise<boolean> {
    console.log("Setting role perms for role: " + roleId)

    const role = getRoleById(roleId)
    if (role == undefined || (!role.editable && !allowNonEditable)) {
        return Promise.reject("Role not editable or does not exist")
    }

    // check toggleable
    if (!allowNonEditable) {
        for (const perm of perms) {
            if (TOGGLEABLE_PERMISSIONS.indexOf(perm.permission) == -1) {
                console.log(`Non toggleable permission supplied at set perms: ${perm.permission}`)
                return Promise.reject("Not toggleable permissions supplied")
            }
        }

        // filter toggleable
        perms = perms.filter(perm => TOGGLEABLE_PERMISSIONS.indexOf(perm.permission) != -1)
    }

    // delete
    await getPrisma().rolePermission.deleteMany({
        where: {
            role_id: role.id,
        }
    })

    // create
    await getPrisma().rolePermission.createMany({
        data: perms
    })

    role.setPermissions(perms)
    return true
}

export async function setRoleOutputs(roleId: number, videohubId: number, outputs: RoleOutput[], allowNonEditable: boolean) {
    console.log("Setting role outputs for role: " + roleId)

    const role = getRoles().get(roleId)
    if (role == undefined || (!role.editable && !allowNonEditable)) {
        return false
    }

    // delete
    await getPrisma().roleOutput.deleteMany({
        where: {
            role_id: role.id,
            videohub_id: videohubId,
        }
    })

    // create
    await getPrisma().roleOutput.createMany({
        data: outputs.filter(output => output.videohub_id === videohubId && output.role_id === roleId)
    })

    role.outputs = outputs
    return true
}

export function addRole(data: any) {
    const prev = getRoleById(data.id)
    if (prev == undefined || prev.editable) {
        getRoles().set(data.id, new Role(data.id, true, data.name, data.permissions?.map((perm: any) => perm.permission) || [], data.outputs || []))
    }
}

export async function setup() {
    await setupRoles()
    await setupVideohubs()

    // set
    getVideohubs().forEach(async hub => {
        await setRoleOutputs(ROLE_ADMIN_ID, hub.id, hub.outputs.map((output: any) => {
            return {
                videohub_id: hub.id,
                output_id: output.id,
                role_id: ROLE_ADMIN_ID,
            }
        }), true)
    })

    console.log("Setup completed.")
}
