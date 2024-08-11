import { getRoleById } from "../../../backend/backend";
import { getRoleByIdBackendUsage } from "../../roles/[slug]/server-roles";
import { IRole } from "@/app/authentification/interfaces";
import { getPrisma } from "@/app/backend/prismadb";
import { checkServerPermission } from "@/app/authentification/server-auth";
import { PERMISSION_USER_EDIT } from "@/app/authentification/permissions";
import { NextRequest } from "next/server";
import { checkHasParams, createResponseInvalid, createResponseValid } from "@/app/util/requestutil";
import { getUsersCache, retrieveUserServerSide, retrieveUsersServerSide, sanitizeUser } from "./server-users";


export async function GET(req: NextRequest,
    { params }: { params: { slug: string } }
) {
    const hasPerms = await checkServerPermission(req);
    if (hasPerms != null) {
        return hasPerms;
    }

    const { slug } = params;
    switch (slug) {
        case "get": {
            return createResponseValid(req, await retrieveUsersServerSide())
        }

        default: {
            return createResponseInvalid(req, "Invalid PID");
        }
    }
}

export async function POST(req: NextRequest,
    { params }: { params: { slug: string } }
) {
    const hasPerms = await checkServerPermission(req);
    if (hasPerms != null) {
        return hasPerms;
    }

    const hasEditPerm = await checkServerPermission(req, PERMISSION_USER_EDIT);
    if (hasEditPerm != null) {
        return hasEditPerm;
    }

    const { slug } = params;
    const body = await req.json()
    switch (slug) {
        case "get": {
            const userId = body.id
            const hasParams = checkHasParams(userId);
            if (hasParams != null) {
                return hasParams;
            }

            return createResponseValid(req, await retrieveUserServerSide(userId))
        }

        case "getrole": {
            const userId = body.id
            if (userId == undefined) {
                return createResponseInvalid(req, "Params missing.")
            }

            const user = await getPrisma().user.findUnique({
                where: {
                    id: userId,
                },
                include: {
                    role: true
                }
            })

            if (user == undefined) {
                return createResponseInvalid(req, "User doesn't exist.")
            }

            return createResponseValid(req, user.role)
        }

        case "delete": {
            const userId = body.id
            if (userId == undefined) {
                return createResponseInvalid(req, "Params missing.")
            }

            const user = await getPrisma().user.findUnique({
                where: {
                    id: userId,
                }
            })

            if (user == undefined) {
                return createResponseInvalid(req, "User doesn't exist.")
            }

            const roleId = user.role_id
            if (roleId != undefined) {
                const role: IRole | undefined = getRoleByIdBackendUsage(roleId)
                if (role != undefined && !role.editable) {
                    return createResponseInvalid(req, "User's role is not editable.")
                }
            }

            await getPrisma().user.delete({
                where: {
                    id: userId,
                }
            })

            getUsersCache().delete(userId)
            return createResponseValid(req)
        }

        case "setrole": {
            const userId = body.user_id
            const roleId = body.role_id
            if (userId == undefined || roleId == undefined) {
                return createResponseInvalid(req, "Params missing.")
            }

            // do not allow editing admin role (example)
            const role: IRole | undefined = getRoleByIdBackendUsage(roleId);
            if (role == undefined || !role.editable) {
                return createResponseInvalid(req, "Role doesn't exist or not editable.")
            }

            const user = await getPrisma().user.findUnique({
                where: {
                    id: userId,
                }
            })

            // user does not exist
            if (user == undefined) {
                return createResponseInvalid(req, "User doesn't exist.")
            }

            // do not allow demoting? (admin for example)
            const userRole = user.role_id ? getRoleById(user.role_id) : undefined;
            if (userRole != undefined && !userRole.editable) {
                return createResponseInvalid(req, "Role of user isn't editable.")
            }

            await getPrisma().user.update({
                where: {
                    id: userId,
                },
                data: {
                    role_id: role.id,
                }
            })

            getUsersCache().delete(userId)
            return createResponseValid(req)
        }

        default: {
            return createResponseInvalid(req, "Invalid PID");
        }
    }
}