import { hasRoleOutput, IUser } from "@/app/authentification/interfaces";
import { PERMISSION_VIDEOHUB_EDIT } from "@/app/authentification/permissions";
import { checkServerPermission, getUserFromToken } from "@/app/authentification/server-auth";
import { ROLE_ADMIN_ID } from "@/app/backend/backend";
import { getPrisma } from "@/app/backend/prismadb";
import { getVideohub, getVideohubs, sendRoutingUpdate, updateDefaultInput } from "@/app/backend/videohubs"
import { IVideohub, IVideohubActivity } from "@/app/interfaces/videohub"
import { checkHasParams, createResponseInvalid, createResponseValid } from "@/app/util/requestutil";
import { VideohubActivity } from "@prisma/client";
import { NextRequest } from "next/server";

export function retrieveVideohubsServerSide(): IVideohub[] {
    return getVideohubs()
}

export function retrieveVideohubServerSide(id: number): IVideohub | undefined {
    return getVideohub(id);
}

export function getVideohubFromQuery(query: any): IVideohub | undefined {
    return retrieveVideohubServerSide(Number(query.videohub))
}

export async function getVideohubActivityServerSide() {
    return await getPrisma().videohubActivity.findMany({
        orderBy: [
            {
                time: 'desc',
            }
        ],
        take: 8,
    }).then((res: VideohubActivity[]) => {
        return res as IVideohubActivity[]
    })
}
