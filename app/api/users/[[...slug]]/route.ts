import { getRoleById } from "../../../backend/backend";
import { IRole, IUser } from "@/app/authentification/interfaces";
import { getPrisma } from "@/app/backend/prismadb";
import { checkServerPermission, getUserIdFromToken } from "@/app/authentification/server-auth";
import { PERMISSION_USER_EDIT } from "@/app/authentification/permissions";
import { NextRequest } from "next/server";
import { createResponseInvalid, createResponseValid } from "@/app/util/requestutil";
import { getUsersCache, retrieveUserServerSide, retrieveUsersServerSide, sanitizeUser } from "./server-users";


export async function GET(req: NextRequest,
    { params }: { params: { slug?: string[] } }
) {
    const { slug } = params;
    if (slug == undefined || slug.length < 1) { // get users
        const hasEditPerm = await checkServerPermission(req, PERMISSION_USER_EDIT);
        if (hasEditPerm != null) {
            return hasEditPerm;
        }

        return createResponseValid(req, await retrieveUsersServerSide());
    }

    const userId: string = slug[0];
    if (userId != await getUserIdFromToken(req)) {
        const hasEditPerm = await checkServerPermission(req, PERMISSION_USER_EDIT);
        if (hasEditPerm != null) {
            return hasEditPerm;
        }
    }

    if (slug.length < 2) {
        return createResponseValid(req, await retrieveUserServerSide(userId));

    } else {
        switch (slug[1]) {
            case "role": {
                const user = await getPrisma().user.findUnique({
                    where: {
                        id: userId,
                    },
                    include: {
                        role: true
                    }
                });

                if (user != undefined) {
                    return createResponseValid(req, user.role);
                }

                break;
            }

            default: {
                break;
            }
        }
    }

    return createResponseInvalid(req);
}

export async function DELETE(req: NextRequest,
    { params }: { params: { slug?: string[] } }) {
    const hasEditPerm = await checkServerPermission(req, PERMISSION_USER_EDIT);
    if (hasEditPerm != null) {
        return hasEditPerm;
    }

    const { slug } = params;
    if (slug != undefined && slug.length > 0) {
        const userId: string | undefined = slug == undefined || slug.length < 1 ? undefined : slug[0];
        if (userId != undefined) {
            const user = await getPrisma().user.findUnique({
                where: {
                    id: userId,
                }
            });

            if (user != undefined) {
                const roleId = user.role_id;
                if (roleId != undefined) {
                    const role: IRole | undefined = getRoleById(roleId);
                    if (role != undefined && !role.editable) {
                        return createResponseInvalid(req, "User's role is not editable.");
                    }
                }

                await getPrisma().user.delete({
                    where: {
                        id: userId,
                    }
                });

                getUsersCache().delete(userId);
                return createResponseValid(req);
            }
        }
    }

    return createResponseInvalid(req);
}

export async function PATCH(req: NextRequest) {
    const hasEditPerm = await checkServerPermission(req, PERMISSION_USER_EDIT);
    if (hasEditPerm != null) {
        return hasEditPerm;
    }

    const body = await req.json() as IUser;

    // do not allow editing admin role (example)
    const role: IRole | undefined = body.role_id == undefined ? undefined : getRoleById(body.role_id);
    if (role != undefined && role.editable) {
        const user = await getPrisma().user.findUnique({
            where: {
                id: body.id,
            }
        });

        // user does not exist
        if (user != undefined) {
            // do not allow demoting? (admin for example)
            const userRole = user.role_id == undefined ? undefined : getRoleById(user.role_id);
            if (userRole == undefined || userRole.editable) {
                await getPrisma().user.update({
                    where: {
                        id: body.id,
                    },
                    data: {
                        role_id: role.id,
                        username: body.username,
                    }
                });

                getUsersCache().delete(body.id); // refresh next time
                return createResponseValid(req);
            }
        }
    }

    return createResponseInvalid(req);
}