import { PERMISSION_VIDEOHUB_SCENES_EDIT } from "@/app/authentification/permissions";
import { checkServerPermission, getUserIdFromToken, isUser } from "@/app/authentification/server-auth";
import { getPrisma } from "@/app/backend/prismadb";
import { getScheduledButtons, getVideohub, getVideohubs } from "@/app/backend/videohubs"
import { IScene, IUpcomingScene } from "@/app/interfaces/scenes";
import { IVideohub, IVideohubActivity, ViewData } from "@/app/interfaces/videohub"
import { convertDateToUTC, setDayOfWeekUTC } from "@/app/util/dateutil";
import { ResponseData } from "@/app/util/requestutil";
import { VideohubActivity } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { retrieveUserServerSide } from "../../users/[[...slug]]/server-users";

export async function retrievePushButtonsServerSide(userId: string, videohubId: number) {
    return retrievePushButtonsServerSideByUser(userId, videohubId)
}

export async function retrievePushButtonsServerSideByUser(userId: string, videohubId: number): Promise<IScene[]> {
    return await getPrisma().scene.findMany({
        where: {
            videohub_id: videohubId,
            user_id: userId,
        },
        include: {
            actions: true,
            triggers: true,
        }
    }).then(res => {
        for (const button of res) {
            button.triggers.forEach(trigger => {
                const date: Date = getTriggerExportTime(trigger.time, trigger.day)
                trigger.time = date
                trigger.day = date.getUTCDay()
            })
        }

        return res as IScene[];
    })
}

function getTriggerExportTime(time: Date, day: number): Date {
    const date: Date = convertDateToUTC(new Date())
    date.setUTCHours(time.getUTCHours())
    date.setUTCMinutes(time.getUTCMinutes())
    date.setUTCSeconds(0)
    setDayOfWeekUTC(date, day)
    return date
}

export async function getUserFromButton(id: number): Promise<string | undefined> {
    return await getPrisma().scene.findUnique({
        where: {
            id: id,
        },
        select: {
            user_id: true
        }
    }).then(res => res?.user_id)
}

export function retrieveScheduledButtons(videohub_id: number, userId?: string): IUpcomingScene[] {
    return userId == undefined ? [] : getScheduledButtons(videohub_id).filter((button: IUpcomingScene) => button.userId === userId)
}


export async function canEditButton(buttonId: number, req: NextRequest, permCheck: boolean = true): Promise<NextResponse<ResponseData> | null> {
    const owner: string | undefined = await getUserFromButton(buttonId)
    const checkUser = isUser(req, owner);
    if (checkUser != null) {
        return checkUser;
    }

    return permCheck ? await checkServerPermission(req, PERMISSION_VIDEOHUB_SCENES_EDIT) : null;
}

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
        take: 15,
    }).then((res: VideohubActivity[]) => {
        return res as IVideohubActivity[]
    })
}

export async function getVideohubViewDataServerSide(videohub: number, userId: string) {
    let selected: IVideohub | undefined = videohub != undefined ? getVideohub(videohub) : undefined;
    const hubs: IVideohub[] = retrieveVideohubsServerSide();

    if (selected == undefined) {
        if (hubs.length != 0) {
            selected = hubs[0];
        }
    }

    let scenes: IScene[];
    let scheduled: IUpcomingScene[];
    if (selected != undefined) {
        scenes = await retrievePushButtonsServerSide(userId, selected.id);
        scheduled = retrieveScheduledButtons(selected.id, userId);
    } else {
        scenes = [];
        scheduled = [];
    }

    return {
        user: JSON.parse(JSON.stringify(await retrieveUserServerSide(userId))),
        videohubs: JSON.parse(JSON.stringify(hubs)),
        videohub: selected ? selected.id : 0,
        scenes: JSON.parse(JSON.stringify(scenes)),
        upcomingScenes: JSON.parse(JSON.stringify(scheduled))
    } as ViewData;
}
