import { getScheduledButtons } from '../../../backend/videohubs';
import { getUserIdFromToken, isUser } from '@/app/authentification/server-auth';
import { getPrisma } from '@/app/backend/prismadb';
import { convertDateToUTC, setDayOfWeekUTC } from '@/app/util/dateutil';
import { IScene, IUpcomingScene } from '@/app/interfaces/scenes';
import { NextRequest, NextResponse } from 'next/server';
import { ResponseData } from '@/app/util/requestutil';

export async function retrievePushButtonsServerSide(req: NextRequest, videohubId: number) {
    return retrievePushButtonsServerSideByUser(await getUserIdFromToken(req), videohubId)
}

export async function retrievePushButtonsServerSideByUser(userId: string, videohubId: number): Promise<IScene[]> {
    return await getPrisma().pushButton.findMany({
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
    return await getPrisma().pushButton.findUnique({
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


export async function canEditButton(buttonId: number, req: NextRequest): Promise<NextResponse<ResponseData> | null> {
    const owner: string | undefined = await getUserFromButton(buttonId)
    return isUser(req, owner)
}