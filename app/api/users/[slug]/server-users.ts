import { sanitizeRole } from "../../roles/[slug]/server-roles";
import { IUser } from "@/app/authentification/interfaces";
import { TTLCacheService } from "@/app/util/TTLCache";
import { getPrisma } from "@/app/backend/prismadb";
import { getUserIdFromToken } from "@/app/authentification/server-auth";
import cache from 'global-cache';


export function sanitizeUser(user: any): IUser {
    return { id: user.id, username: user.username, role_id: user.role_id, role: sanitizeRole(user.role) }
}

let usersCache: any = cache.get("usersCache")
if (usersCache == undefined) {
    usersCache = new TTLCacheService({ max: 100, ttl: 1000 * 60 * 30 });
    cache.set("usersCache", usersCache)
}

export function getUsersCache(): TTLCacheService {
    return usersCache;
}


export const selectUserParams: any = {
    password: false, // NO password
    usernameHash: false, // NO username
    id: true,
    username: true,
    role_id: true,
}

export async function retrieveUsersServerSide() {
    const users = await getPrisma().user.findMany({
        select: selectUserParams // dpes not include role
    })

    const arr: IUser[] = [];
    for (const user of users) {
        arr.push(sanitizeUser(user))
    }

    return arr;

}

export async function retrieveUserServerSideByReq(req: any) {
    const id = await getUserIdFromToken(req)
    return id == undefined ? {} : await retrieveUserServerSide(id)
}

export async function retrieveUserExists(userId?: string) {
    return userId != undefined && await retrieveUserServerSide(userId) != undefined
}

export async function retrieveUserServerSide(userId?: string) {
    if (userId == undefined) {
        return undefined
    }

    const cacheResult: IUser | undefined = usersCache.get(userId)
    if (cacheResult != undefined) {
        return cacheResult
    } else {
        const user = await getPrisma().user.findUnique({
            where: {
                id: userId,
            },
            select: {
                ...selectUserParams,
                role: {
                    include: {
                        permissions: true,
                        outputs: true,
                    }
                }
            } // does include role
        })

        const res: IUser | undefined = user == undefined ? undefined : sanitizeUser(user)
        usersCache.set(userId, res)
        return res
    }
}

export async function doesJWTUserExist(name: string): Promise<boolean> {
    const exists: boolean = await getPrisma().user.findUnique({ where: { username: name } }).then(res => res != null);
    return exists;
}