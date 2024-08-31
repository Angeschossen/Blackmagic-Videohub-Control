import { getSunrise, getSunset } from 'sunrise-sunset-js';
import { ICON_ERROR, ICON_SUCCESS, Videohub } from './videohubs';
import { getPrisma } from './prismadb';
import { SceneTrigger, TriggerType } from '@prisma/client';
import { getMillisecondOfDayUTC, getSecondOfDayUTC } from '../util/dateutil';

export class Button {
    id: number;
    videohub: Videohub;
    label: string;
    time: Date;
    userId: string;
    cancelled: boolean = false;
    scheduledTrigger: NodeJS.Timeout | undefined = undefined;

    constructor(videohub: Videohub, id: number, label: string, time: Date, userId: string) {
        this.id = id
        this.videohub = videohub
        this.label = label
        this.time = time
        this.userId = userId
    }

    cancel(cancel: boolean) {
        this.cancelled = cancel
    }

    info(msg: string) {
        console.log(`[${new Date().toLocaleString()}] [Button ${this.id}] ${msg}`)
    }

    stopSchedule() {
        clearTimeout(this.scheduledTrigger)
    }

    async handleScheduleNextTrigger(date: Date) {
        this.stopSchedule()

        const next = await this.retrieveUpcomingTriggers(date)
        this.info(`Retrieved ${next.length} upcoming triggers.`)
        if (next.length === 0) {
            this.videohub.removeScheduledButton(this.id)
            return false
        }

        await this.scheduleNextTrigger(next[0])
        return true
    }


    async goToNext() {
        // go to next
        if (await this.handleScheduleNextTrigger(new Date())) {
            this.videohub.emitScheduleChange()
            return true
        }

        return false
    }

    async scheduleNextTrigger(trigger: SceneTrigger) {
        this.time = trigger.time; // update, wrap into new Date to prevent wrong time at client side
        if (this.scheduledTrigger != undefined) {
            this.videohub.onScheduledTimeChanged();
        }

        // stop current schedule
        this.stopSchedule();

        // calculate difference in milliseconds
        const atMilli = getMillisecondOfDayUTC(trigger.time);
        const currMilli = getMillisecondOfDayUTC(new Date());
        const diffMillis = atMilli - currMilli;
        this.info(`Next trigger (at ${atMilli} millisecond(s) of the day) is in ${diffMillis} millisecond(s). Current millisecond of the day: ${currMilli}`);

        this.scheduledTrigger = setTimeout(async () => {
            if (!this.cancelled) {
                await this.videohub.executeButton(trigger.scene_id).then(async result => {
                    const label = await getLabelOfButton(trigger.scene_id);

                    if (!result.result) {
                        this.videohub.addFailedButton(this);
                        await this.videohub.logActivity("scheduled.failed", ICON_ERROR);
                    } else {
                        await this.videohub.logActivity("scheduled.success", ICON_SUCCESS);
                    }

                    await this.goToNext();
                });
            } else {
                await this.goToNext();
            }
        }, diffMillis);
    }

    async retrieveUpcomingTriggers(date: Date) {
        this.info("Retrieving upcoming triggers.");

        const time = date;
        return await getPrisma().sceneTrigger.findMany({
            where: {
                videohub_id: this.videohub.data.id,
                scene_id: this.id, day: time.getUTCDay(),
                time: { gte: time }
            }, orderBy: { time: 'asc' }
        });
    }
}


const BUTTON_SELECT = {
    scene_id: true,
    time: true,
    scene: {
        select: {
            label: true,
            user_id: true,
        }
    },
}

async function updateSunriseSetType(videohub: Videohub, t: TriggerType, time: Date) {
    return await getPrisma().sceneTrigger.updateMany({
        where: {
            type: t,
            videohub_id: videohub.data.id,
            day: new Date().getUTCDay(),
        },
        data: {
            time: time
        }
    })
}


export async function getLabelOfButton(buttonId: number): Promise<string | undefined> {
    return await getPrisma().scene.findUnique({
        where: {
            id: buttonId
        },
        select: {
            label: true,
        }
    }).then(res => res?.label)
}

export async function retrievescheduledButton(videohub: Videohub, buttonId: number, time: Date) {
    const res = await getPrisma().sceneTrigger.findFirst({
        where: {
            videohub_id: videohub.data.id,
            day: time.getDay(),
            scene_id: buttonId,
            time: {
                gte: time
            }
        },
        select: BUTTON_SELECT
    })

    if (res != undefined) {
        return new Button(videohub, buttonId, res.scene.label, res.time, res.scene.user_id)
    } else {
        return undefined
    }
}

export async function updateSunriseSet(videohub: Videohub) {
    const latitude = videohub.data.latitude, longitude = videohub.data.longitude;
    await updateSunriseSetType(videohub, "SUNRISE", getSunrise(latitude, longitude))
    await updateSunriseSetType(videohub, "SUNSET", getSunset(latitude, longitude))
}

export async function retrieveScheduledButtonsToday(videohub: Videohub) {
    const time = new Date()

    console.log(`Retrieving buttons for date: ${time.toLocaleString()} Day: ${time.getUTCDay()}`)
    const res = await getPrisma().sceneTrigger.findMany({
        where: {
            videohub_id: videohub.data.id,
            day: time.getUTCDay(),
            time: {
                gte: time
            }
        },
        select: BUTTON_SELECT
    })

    const buttons = []
    const done = new Set()

    for (const button of res) {
        const id = button.scene_id
        if (done.has(id)) {
            continue
        }

        const b = new Button(videohub, id, button.scene.label, button.time, button.scene.user_id)
        buttons.push(b)
        done.add(id)
    }

    return buttons
}