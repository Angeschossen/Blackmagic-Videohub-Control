import { RoleOutput, RolePermission, Videohub } from "@prisma/client";

export interface IUser {
    id: string,
    username: string,
    role_id?: number,
    role?: IRole,
}

export interface IRole {
    id: number,
    editable: boolean,
    name: string,
    outputs: RoleOutput[],
    permissions: string[],
}

export function hasRoleOutput(role: IRole | undefined, videohub: number, output_id: number): boolean {
    const res = role != undefined && role.outputs.find(output => {
        return output.videohub_id === videohub && output.output_id === output_id;
    }) != undefined
    return res;
}
