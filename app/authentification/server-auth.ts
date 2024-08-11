import { getToken } from "next-auth/jwt";
import { getRoleById } from "../backend/backend";
import { IUser } from "./interfaces";
import { createResponseInvalid, createResponseInvalidTransparent, createResponseUnauthorized, ResponseData } from "../util/requestutil";
import { NextRequest, NextResponse } from "next/server";


export async function isUser(req: NextRequest, userId?: string): Promise<NextResponse<ResponseData> | null> {
    const idFromToken: string = await getUserIdFromToken(req)

    if (userId == undefined || idFromToken != userId) {
        return Promise.resolve(createResponseInvalid(req, "User is not same as Id parameter."))
    }

    return Promise.resolve(null)
}
export async function checkServerPermission(req: NextRequest, permission?: string): Promise<NextResponse<ResponseData> | null> {
    return await checkServerPermissionCol(req, permission ? [permission] : undefined)
}

export async function checkServerPermissionCol(req: NextRequest, permission?: string[]): Promise<NextResponse<ResponseData> | null> {
    const token = await getToken({ req: req });
    if (!handleCheckPermission(token, permission)) {
        return createResponseUnauthorized(req)
    }

    return Promise.resolve(null);
}

export async function getUserIdFromToken(req: NextRequest) {
    const token: any = await getToken({ req: req });
    return token.user.id
}

export async function getUserFromToken(req: any): Promise<IUser> {
    const token: any = await getToken({ req: req });
    return token.user
}

export function handleCheckPermission(obj: any, permission?: string[]) {
    if (obj != undefined && obj.user.role_id != undefined) {
        const role = getRoleById(obj.user.role_id);
        if (role != undefined) {
            if (permission == undefined) {
                return true;
            }

            for (const perm of permission) {
                if (!role.hasPermission(perm)) {
                    return false;
                }
            }

            return true;
        }
    }

    return false;
}