import { RoleOutput, RolePermission } from "@prisma/client";
import { addRole, getRoleById, getRoles, removeRole, Role, setRoleOutputs, setRolePermissions } from "../../../backend/backend";
import { NextRequest, NextResponse } from "next/server";
import { PERMISSION_ROLE_EDIT, PERMISSION_USER_EDIT } from "../../../authentification/permissions";
import { IRole } from "../../../authentification/interfaces";
import { getPrisma } from "../../../backend/prismadb";
import { checkServerPermission, checkServerPermissionCol } from "@/app/authentification/server-auth";
import { createResponseValid, checkHasParams, createResponseInvalid, ResponseData } from "@/app/util/requestutil";
import { retrieveRolesServerSide, retrievePermissionsServerSide, getRoleByIdBackendUsage } from "./server-roles";
import { AdminViewData } from "@/app/interfaces/roles";
import { retrieveVideohubsServerSide } from "../../videohubs/[slug]/server-videohubs";
import { retrieveUsersServerSide } from "../../users/[slug]/server-users";


export async function GET(req: NextRequest,
    { params }: { params: { slug: string } }
): Promise<NextResponse<ResponseData>> {
    const hasPerms = await checkServerPermission(req);
    if (hasPerms != null) {
        return hasPerms;
    }

    const { slug } = params;
    switch (slug) {
        case "get": {
            return createResponseValid(req, retrieveRolesServerSide())
        }

        case "getPermissions": {
            const hasPerm = await checkServerPermission(req, PERMISSION_ROLE_EDIT);
            if (hasPerm != null) {
                return hasPerm;
            }

            return createResponseValid(req, retrievePermissionsServerSide())
        }

        case "getAdminViewData": {
            const hasPerm = await checkServerPermissionCol(req, [PERMISSION_ROLE_EDIT, PERMISSION_USER_EDIT]);
            if (hasPerm != null) {
                return hasPerm;
            }

            return createResponseValid(req, {
                videohubs: retrieveVideohubsServerSide(),
                roles: retrieveRolesServerSide(),
                users: await retrieveUsersServerSide(),
                permissions: retrievePermissionsServerSide(),
            } as AdminViewData);
        }

        default: {
            return createResponseInvalid(req, "Invalid PID.")
        }
    }
}

export async function POST(req: NextRequest,
    { params }: { params: { slug: string } }
): Promise<NextResponse<ResponseData>> {
    const hasPerms = await checkServerPermission(req);
    if (hasPerms != null) {
        return hasPerms;
    }

    const { slug } = params;
    switch (slug) {
        case "haspermission": {
            const body = await req.json();
            const permission: string = body.permission;
            const role_id: number = body.role_id;

            const hasParams = checkHasParams(req, role_id, permission);
            if (hasParams != null) {
                return hasParams;
            }

            const role: any = getRoleById(role_id)
            return createResponseValid(req, { result: role != undefined && (permission == undefined || role.hasPermission(permission)) })
        }

        case "delete": {
            const hasPerm = await checkServerPermission(req, PERMISSION_ROLE_EDIT);
            if (hasPerm != null) {
                return hasPerm;
            }

            const body = await req.json();
            const role: IRole | undefined = getRoleByIdBackendUsage(body.role_id);
            if (role == undefined || !role.editable) {
                return createResponseValid(req, "Role doesn't exist or isn't editable.")
            }

            await getPrisma().role.delete({
                where: {
                    id: role.id,
                }
            })

            removeRole(role.id)
            return createResponseValid(req)
        }

        case "upsert": {
            const hasPerm = await checkServerPermission(req, PERMISSION_ROLE_EDIT);
            if (hasPerm != null) {
                return hasPerm;
            }

            const body = await req.json();
            const role: IRole = body.role;
            if (role == undefined) {
                return createResponseInvalid(req, "Parameters missing.")
            }

            role.name = role.name.trim()

            // name len
            if (role.name.length == 0 || role.name.length > 32) {
                return createResponseInvalid(req, "The name must be between 1 and 32 characters long.");
            }

            let p: any
            if (role.id == -1) {
                p = await getPrisma().role.create({
                    data: {
                        name: role.name,
                        editable: true, // always editable
                    }
                });
            } else {
                p = await getPrisma().role.update({
                    where: {
                        id: role.id,
                    },
                    data: {
                        name: role.name, // do not override editable
                    }
                });
            }


            addRole(p) // insert or update
            p.editable = true
            return createResponseValid(req, p);
        }

        case "setpermissions": {
            const hasPerm = await checkServerPermission(req, PERMISSION_ROLE_EDIT);
            if (hasPerm != null) {
                return hasPerm;
            }

            const body = await req.json()
            const role_id = body.role_id
            let permissions: string[] = body.permissions
            if (role_id == undefined || permissions == undefined) {
                return createResponseInvalid(req, "Parameters missing.")
            }

            const role: IRole | undefined = getRoleByIdBackendUsage(role_id)
            if (role == undefined || !role.editable) {
                return createResponseInvalid(req, "Role doesn't exist or isn't editable.")
            }

            if (!await setRolePermissions(role.id, permissions.map(perm => {
                return { permission: perm, role_id: role_id }
            }), false)) {
                return createResponseInvalid(req, "Contains non toggleable permissions.")
            }

            return createResponseValid(req)
        }

        case "setoutputs": {
            const hasPerm = await checkServerPermission(req, PERMISSION_ROLE_EDIT);
            if (hasPerm != null) {
                return hasPerm;
            }

            const body = await req.json()
            const videohub_id = body.videohub_id
            const role_id = body.role_id
            const outputs: number[] = body.outputs

            if (videohub_id == undefined || role_id == undefined || outputs == undefined) {
                return createResponseInvalid(req, "Parameters missing.")
            }

            if (!await setRoleOutputs(role_id, videohub_id, outputs.map(output => {
                return { videohub_id: videohub_id, role_id: role_id, output_id: output }
            }), false)) {
                return createResponseInvalid(req, "Role doesn't exist or isn't editable.")
            }

            return createResponseValid(req)
        }

        default: {
            return createResponseInvalid(req, "Invalid PID.")
        }
    }
}