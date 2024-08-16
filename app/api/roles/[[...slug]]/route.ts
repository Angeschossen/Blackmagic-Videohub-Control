import { addRole, getRoleById, removeRole, Role, setRoleOutputs, setRolePermissions } from "../../../backend/backend";
import { NextRequest, NextResponse } from "next/server";
import { PERMISSION_ROLE_EDIT, PERMISSION_USER_EDIT } from "../../../authentification/permissions";
import { IRole } from "../../../authentification/interfaces";
import { getPrisma } from "../../../backend/prismadb";
import { checkServerPermission, checkServerPermissionCol } from "@/app/authentification/server-auth";
import { createResponseValid, checkHasParams, createResponseInvalid, ResponseData, createResponseInvalidTransparentWithStatus, checkSlugLength } from "@/app/util/requestutil";
import { retrieveRolesServerSide, retrievePermissionsServerSide } from "./server-roles";
import { AdminViewData } from "@/app/interfaces/roles";
import { retrieveVideohubsServerSide } from "../../videohubs/[[...slug]]/server-videohubs";
import { retrieveUsersServerSide } from "../../users/[[...slug]]/server-users";
import { isNumeric } from "@/app/util/mathutil";


export async function GET(req: NextRequest,
    { params }: { params: { slug?: string[] } }
): Promise<NextResponse<ResponseData>> {
    const hasPerms = await checkServerPermission(req);
    if (hasPerms != null) {
        return hasPerms;
    }

    const { slug } = params;
    if (slug == undefined || slug.length < 1) {
        const hasPerms = await checkServerPermission(req, PERMISSION_ROLE_EDIT);
        if (hasPerms != null) {
            return hasPerms;
        }

        return createResponseValid(req, retrieveRolesServerSide());
    }

    console.log(slug)
    switch (slug[0]) {
        case "permissions": {
            const hasPerm = await checkServerPermission(req, PERMISSION_ROLE_EDIT);
            if (hasPerm != null) {
                return hasPerm;
            }

            return createResponseValid(req, retrievePermissionsServerSide());
        }

        case "admin-view": {
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
            if (isNumeric(slug[0])) {
                const role: Role | undefined = getRoleById(Number(slug[0]));
                if (role != undefined) {
                    const slugLength = checkSlugLength(req, 2, slug);
                    if (slugLength != null) {
                        return slugLength;
                    }

                    switch (slug[1]) {
                        case "permission": {
                            const permission: string | null = req.nextUrl.searchParams.get("permission");
                            return createResponseValid(req, { result: permission == null || role.hasPermission(permission) });
                        }

                        default: break;
                    }
                }
            }

            break;
        };
    }

    return createResponseInvalid(req);
}

export async function DELETE(req: NextRequest,
    { params }: { params: { slug?: string[] } }
): Promise<NextResponse<ResponseData>> {
    const hasPerm = await checkServerPermission(req, PERMISSION_ROLE_EDIT);
    if (hasPerm != null) {
        return hasPerm;
    }

    const { slug } = params;

    if (slug != undefined) {
        const slugLength = checkSlugLength(req, 1, slug);
        if (slugLength != null) {
            return slugLength;
        }

        if (isNumeric(slug[0])) {
            const role: Role | undefined = getRoleById(Number(slug[0]));
            if (role != undefined && role.editable) {
                await getPrisma().role.delete({
                    where: {
                        id: role.id,
                    }
                });

                removeRole(role.id);
                return createResponseValid(req);
            }
        }
    }

    return createResponseInvalid(req);
}

export async function PUT(req: NextRequest,
    { params }: { params: { slug?: string[] } }
): Promise<NextResponse<ResponseData>> {
    const hasPerm = await checkServerPermission(req, PERMISSION_ROLE_EDIT);
    if (hasPerm != null) {
        return hasPerm;
    }

    const { slug } = params;
    if (slug == undefined || slug.length < 1) {
        const role: IRole = await req.json();
        if (role != undefined) {
            console.log(role.name)
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
    } else {
        const slugLength = checkSlugLength(req, 1, slug);
        if (slugLength != null) {
            return slugLength;
        }

        if (isNumeric(slug[0])) {
            const role: Role | undefined = getRoleById(Number(slug[0]));
            if (role != undefined) {
                const slugLength = checkSlugLength(req, 2, slug);
                if (slugLength != null) {
                    return slugLength;
                }

                switch (slug[1]) {
                    case "permissions": {
                        const body = await req.json()
                        const permissions: string[] = body.permissions;
                        const hasParams = checkHasParams(req, permissions);
                        if (hasParams != null) {
                            return hasParams;
                        }

                        if (!await setRolePermissions(role.id, permissions.map(perm => {
                            return { permission: perm, role_id: role.id }
                        }), false)) {
                            return createResponseInvalid(req, "Contains non toggleable permissions.")
                        }

                        return createResponseValid(req);
                    }

                    case "outputs": {
                        const body = await req.json();
                        const videohub_id = body.videohub_id;
                        const outputs: number[] = body.outputs;
                        const hasParams = checkHasParams(req, videohub_id, outputs);
                        if (hasParams != null) {
                            return hasParams;
                        }

                        if (!await setRoleOutputs(role.id, videohub_id, outputs.map(output => {
                            return { videohub_id: videohub_id, role_id: role.id, output_id: output }
                        }), false)) {
                            return createResponseInvalid(req, "Role doesn't exist or isn't editable.")
                        }

                        return createResponseValid(req);
                    }

                    default: break;
                }
            }
        }
    }

    return createResponseInvalid(req);
}