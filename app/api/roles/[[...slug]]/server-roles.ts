import { RoleOutput, RolePermission } from "@prisma/client";
import { getRoleById, getRoles, removeRole, Role, setRoleOutputs, setRolePermissions } from "../../../backend/backend";
import { IRole } from "@/app/authentification/interfaces";
import { TOGGLEABLE_PERMISSIONS } from "@/app/authentification/permissions";

export function retrieveRolesServerSide(): IRole[] {
    return Array.from(getRoles().values());
}

export function sanitizeRole(role: { id: number, editable: boolean, name: string, outputs?: RoleOutput[], permissions?: RolePermission[] }): IRole | undefined {
    return role == undefined ? undefined : {
        id: role.id,
        editable: role.editable,
        name: role.name,
        outputs: role.outputs || [],
        permissions: role.permissions == undefined ? [] : Array.from(role.permissions).map((entry: RolePermission) => entry.permission)
    }
}

export function retrievePermissionsServerSide(): string[] {
    return TOGGLEABLE_PERMISSIONS;
}