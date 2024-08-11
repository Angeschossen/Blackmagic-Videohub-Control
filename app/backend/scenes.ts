import { getSunrise, getSunset } from 'sunrise-sunset-js';
import { ICON_ERROR, ICON_SUCCESS, Videohub } from './videohubs';
import { getPrisma } from './prismadb';
import { PushButtonTrigger, TriggerType } from '@prisma/client';
import { getSecondOfDayUTC } from '../util/dateutil';

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

    async scheduleNextTrigger(trigger: PushButtonTrigger) {
        this.time = trigger.time // update, wrap into new Date to prevent wrong time at client side
        if (this.scheduledTrigger != undefined) {
            this.videohub.onScheduledTimeChanged()
        }

        this.stopSchedule()

        // diff
        const at = getSecondOfDayUTC(trigger.time)
        const curr = getSecondOfDayUTC(new Date())
        const diff = at - curr
        this.info(`Next trigger (at ${at}) is in ${diff} second(s). Current second of day: ${curr}`)

        this.scheduledTrigger = setTimeout(async () => {
            if (!this.cancelled) {
                await this.videohub.executeButton(trigger.pushbutton_id).then(async result => {
                    const label = await getLabelOfButton(trigger.pushbutton_id)

                    if (result != undefined) {
                        this.videohub.addFailedButton(this)
                        await this.videohub.logActivity(`Scheduled scene failed: ${label}`, ICON_ERROR);
                    } else {
                        await this.videohub.logActivity(`Scheduled scene applied successfully: ${label}`, ICON_SUCCESS);
                    }

                    // go to next
                    await this.goToNext()
                })
            } else {
                // go to next
                await this.goToNext()
            }
        }, diff * 1000)
    }

    async retrieveUpcomingTriggers(date: Date) {
        this.info("Retrieving upcoming triggers.")

        const time = date
        return await getPrisma().pushButtonTrigger.findMany({
            where: {
                videohub_id: this.videohub.data.id,
                pushbutton_id: this.id,
                day: time.getUTCDay(),
                time: {
                    gte: time
                }
            },
            orderBy: {
                time: 'asc'
            }
        })
    }
}


const BUTTON_SELECT = {
    pushbutton_id: true,
    time: true,
    pushbutton: {
        select: {
            label: true,
            user_id: true,
        }
    },
}

async function updateSunriseSetType(videohub: Videohub, t: TriggerType, time: Date) {
    return await getPrisma().pushButtonTrigger.updateMany({
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
    return await getPrisma().pushButton.findUnique({
        where: {
            id: buttonId
        },
        select: {
            label: true,
        }
    }).then(res => res?.label)
}

export async function retrievescheduledButton(videohub: Videohub, buttonId: number, time: Date) {
    const res = await getPrisma().pushButtonTrigger.findFirst({
        where: {
            videohub_id: videohub.data.id,
            day: time.getDay(),
            pushbutton_id: buttonId,
            time: {
                gte: time
            }
        },
        select: BUTTON_SELECT
    })

    if (res != undefined) {
        return new Button(videohub, buttonId, res.pushbutton.label, res.time, res.pushbutton.user_id)
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
    const res = await getPrisma().pushButtonTrigger.findMany({
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
        const id = button.pushbutton_id
        if (done.has(id)) {
            continue
        }

        const b = new Button(videohub, id, button.pushbutton.label, button.time, button.pushbutton.user_id)
        buttons.push(b)
        done.add(id)
    }

    return buttons
}