import { PushButton, PushButtonAction, PushButtonTrigger, TriggerType } from '@prisma/client';
import { cancelScheduledButton, executeButton, handleButtonDeletion, handleButtonReSchedule, retrieveUpcomingTriggers } from '../../../backend/videohubs';
import { checkServerPermission, getUserIdFromToken } from '@/app/authentification/server-auth';
import { getPrisma } from '@/app/backend/prismadb';
import { removeSecondsFromDate, setDayOfWeek } from '@/app/util/dateutil';
import { PERMISSION_VIDEOHUB_SCENES_EDIT } from '@/app/authentification/permissions';
import { IRoutingUpdate, IScene, ISceneTrigger } from '@/app/interfaces/scenes';
import { NextRequest } from 'next/server';
import { checkHasParams, createResponseInvalid, createResponseValid } from '@/app/util/requestutil';
import { canEditButton, retrievePushButtonsServerSide, retrieveScheduledButtons } from './server-scenes';


export async function GET(req: NextRequest,
    { params }: { params: { slug: string } }
) {
    const hasPerms = await checkServerPermission(req);
    if (hasPerms != null) {
        return hasPerms;
    }

    const body = await req.json()
    const videohub_id = body.videohub_id
    if (videohub_id === undefined) {
        return createResponseInvalid(req, "Parameters missing.")
    }

    const { slug } = params;
    switch (slug) {

        default: {
            return createResponseInvalid(req, "Invalid PID.")
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

    const body = await req.json()
    const videohub_id = body.videohub_id
    if (videohub_id === undefined) {
        return createResponseInvalid(req, "Parameters missing.")
    }

    const { slug } = params;
    switch (slug) {
        
        case "get": {
            return createResponseValid(req, await retrievePushButtonsServerSide(req, videohub_id))
        }

        case "getUpcoming": {
            const date = body.date
            if (date == undefined) {
                return createResponseInvalid(req, "Parameters missing.")
            }

            return createResponseValid(req, await retrieveUpcomingTriggers(date, videohub_id))
        }

        case "cancel": {
            const buttonId: number = body.buttonId
            const cancel: boolean = body.cancel;

            const hasParams = checkHasParams(req, buttonId, cancel);
            if (hasParams != null) {
                return hasParams;
            }

            const canEdit = await canEditButton(buttonId, req);
            if (canEdit != null) {
                return canEdit;
            }

            cancelScheduledButton(videohub_id, buttonId, cancel)
            return createResponseValid(req, { result: true })
        }
    
        case "execute": {
            const buttonId: number = body.id;
            const videohub_id: number = body.videohub_id;

            const hasParams = checkHasParams(req, buttonId, videohub_id)
            if (hasParams != null) {
                return hasParams;
            }

            const canEdit = await canEditButton(buttonId, req);
            if (canEdit != null) {
                return canEdit;
            }

            return createResponseValid(req, { result: await executeButton(videohub_id, buttonId) })
        }

        case "getScheduled": {
            const videohub_id: number = body.videohub_id;
            const hasParams = checkHasParams(req, videohub_id);
            if (hasParams != null) {
                return hasParams;
            }

            return createResponseValid(req, retrieveScheduledButtons(videohub_id, await getUserIdFromToken(req)))
        }

        case "delete": {
            const hasPerm = await checkServerPermission(req, PERMISSION_VIDEOHUB_SCENES_EDIT);
            if (hasPerm != null) {
                return hasPerm;
            }

            const id: number | undefined = body.id;
            if (id == undefined) {
                return createResponseInvalid(req, "Missing parameters.")
            }

            const canEdit = await canEditButton(id, req);
            if (canEdit != null) {
                return canEdit;
            }

            await getPrisma().pushButton.delete({
                where: {
                    id: id,
                }
            })

            handleButtonDeletion(id)
            return createResponseValid(req);
        }

        case "update": {
            const hasPerm = await checkServerPermission(req, PERMISSION_VIDEOHUB_SCENES_EDIT);
            if (hasPerm != null) {
                return hasPerm;
            }

            let pushButton: IScene = body;
            const sorting: number = Number(pushButton.sorting)
            if (pushButton.id == -1) { // create
                const result: any = await getPrisma().pushButton.create({
                    data: {
                        videohub_id: videohub_id,
                        label: pushButton.label,
                        color: pushButton.color,
                        description: pushButton.description,
                        display: pushButton.display,
                        sorting: sorting,
                        user_id: await getUserIdFromToken(req),
                    }
                })

                // adjust ids
                const arr: IRoutingUpdate[] = [];
                for (const action of pushButton.actions) {
                    const create = {
                        pushbutton_id: result.id,
                        videohub_id: videohub_id,
                        input_id: action.input_id,
                        output_id: action.output_id,
                    } as PushButtonAction

                    const res: IRoutingUpdate = await getPrisma().pushButtonAction.create({
                        data: create
                    })

                    arr.push(res)
                }

                result.actions = arr;
                return createResponseValid(req, result)

            } else {
                const hasPerm = await canEditButton(pushButton.id, req);
                if (hasPerm != null) {
                    return hasPerm;
                }

                const r: PushButton = await getPrisma().pushButton.update({
                    where: {
                        id: pushButton.id,
                    },
                    data: {
                        label: pushButton.label,
                        color: pushButton.color,
                        display: pushButton.display,
                        sorting: sorting,
                        description: pushButton.description,
                    }
                })

                const result: IScene = {
                    ...r,
                    actions: [],
                    triggers: [],
                    color: r.color || undefined,
                }

                // check actions
                const existingActions: PushButtonAction[] = await getPrisma().pushButtonAction.findMany({
                    where: {
                        pushbutton_id: pushButton.id,
                    }
                })

                const del: number[] = []
                existingActions.forEach(action => {
                    if (pushButton.actions.find(a => a.id === action.id) == undefined) {
                        del.push(action.id)
                    }
                })

                // delete no longer existing ones
                await getPrisma().pushButtonAction.deleteMany({
                    where: {
                        id: {
                            in: del
                        }
                    }
                })

                // update
                for (const a of existingActions.filter(a => {
                    return del.indexOf(a.id) === -1 && pushButton.actions.find(aa => aa.id === a.id)
                })) {
                    const upd = pushButton.actions.find(aa => aa.id === a.id)
                    if (upd != undefined) {
                        const r: IRoutingUpdate = await getPrisma().pushButtonAction.update({
                            where: {
                                id: a.id,
                            },
                            data: {
                                input_id: upd.input_id,
                                output_id: upd.output_id,
                            }
                        })

                        result.actions.push(r)
                    }
                }

                // create
                pushButton.actions
                    .filter(a => a.id == -1 && result.actions.find(aa => aa.id === a.id) == undefined) // double check is creation (-1) and make sure it's not update
                    .forEach(async action => {
                        const create = {
                            pushbutton_id: result.id,
                            videohub_id: videohub_id,
                            input_id: action.input_id,
                            output_id: action.output_id,
                        } as PushButtonAction

                        const rr: IRoutingUpdate = await getPrisma().pushButtonAction.create({
                            data: create
                        })

                        result.actions.push(rr)
                    })

                return createResponseValid(req, result)
            }
        }

        case "setTriggers": {
            const hasPerm = await checkServerPermission(req, PERMISSION_VIDEOHUB_SCENES_EDIT);
            if (hasPerm != null) {
                return hasPerm;
            }

            const buttonId = body.pushbutton_id
            const triggers: ISceneTrigger[] = body.triggers
            const actions: IRoutingUpdate[] = body.actions;

            const hasParams = checkHasParams(req, buttonId, triggers, actions)
            if (hasParams != null) {
                return hasParams;
            }

            const canEdit = await canEditButton(buttonId, req);
            if (canEdit != null) {
                return canEdit;
            }

            // triggers
            await getPrisma().pushButtonTrigger.deleteMany({
                where: {
                    pushbutton_id: buttonId,
                }
            })

            for (const trigger of triggers) {
                let r: PushButtonTrigger[] = []
                // make sure day only once
                const days: Set<number> = new Set(trigger.days)

                for (const action of actions) {
                    days.forEach(day => {
                        const date: Date = new Date(trigger.time)
                        setDayOfWeek(date, day)
                        removeSecondsFromDate(date)

                        let t: TriggerType
                        if (trigger.type == "TIME") {
                            t = TriggerType.TIME
                        } else if (trigger.type == "SUNRISE") {
                            t = TriggerType.SUNRISE
                        } else {
                            t = TriggerType.SUNSET
                        }

                        const obj: PushButtonTrigger = {
                            id: "",
                            pushbutton_id: buttonId,
                            time: date,
                            type: t,
                            day: date.getUTCDay(),
                            videohub_id: action.videohub_id,
                            output_id: action.output_id,
                            action_id: action.id,
                        };

                        (obj as any).id = undefined
                        r.push(obj)
                    })
                }

                // save one to get id
                const len: number = r.length
                if (len != 0) {
                    // save first to get id
                    const id = await getPrisma().pushButtonTrigger.create({
                        data: r[0]
                    }).then(res => res.id)

                    r.splice(0, 1)
                    await getPrisma().pushButtonTrigger.createMany({
                        data: r.map(trigger => {
                            trigger.id = id
                            return trigger
                        })
                    })
                }
            }

            await handleButtonReSchedule(videohub_id, buttonId)
            return createResponseValid(req)
        }

        default: {
            return createResponseInvalid(req, "Invalid PID.")
        }
    }
}
