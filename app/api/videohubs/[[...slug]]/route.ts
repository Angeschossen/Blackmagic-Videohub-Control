import { hasRoleOutput, IUser } from "@/app/authentification/interfaces";
import { PERMISSION_VIDEOHUB_EDIT, PERMISSION_VIDEOHUB_SCENES_EDIT } from "@/app/authentification/permissions";
import { checkServerPermission, getUserFromToken, getUserIdFromToken } from "@/app/authentification/server-auth";
import { ROLE_ADMIN_ID } from "@/app/backend/backend";
import { getPrisma } from "@/app/backend/prismadb";
import { executeButton, getScheduledButton, getVideohub, getVideohubClient, handleButtonDeletion, handleButtonReSchedule, sendRoutingUpdate, updateDefaultInput, Videohub } from "@/app/backend/videohubs"
import { IVideohub, ViewData } from "@/app/interfaces/videohub"
import { checkHasParams, checkSlugLength, createResponseInvalid, createResponseInvalidTransparentWithStatus, createResponseValid, ResponseData } from "@/app/util/requestutil";
import { NextRequest, NextResponse } from "next/server";
import { retrieveVideohubsServerSide, getVideohubActivityServerSide, canEditButton as checkCanEditButton, retrievePushButtonsServerSide, retrieveScheduledButtons } from "./server-videohubs";
import { ICancelScheduledSceneRequest, IPatchTriggersSceneRequest, IRoutingUpdate, IScene, ISceneTrigger, IUpcomingScene } from "@/app/interfaces/scenes";
import { retrieveUserServerSide } from "../../users/[[...slug]]/server-users";
import { isNumeric } from "@/app/util/mathutil";
import { Button } from "@/app/backend/scenes";
import { Scene, SceneAction, SceneTrigger, TriggerType } from "@prisma/client";
import { removeSecondsFromDate, setDayOfWeek } from "@/app/util/dateutil";


export async function PUT(req: NextRequest,
    { params }: { params: { slug?: string[] } }) {
    const { slug } = params;

    if (slug == undefined || slug.length < 1) { // create new videohub
        const hasPerms = await checkServerPermission(req, PERMISSION_VIDEOHUB_EDIT);
        if (hasPerms != null) {
            return hasPerms;
        }

        const videohub = await req.json() as IVideohub;
        if (videohub.id != -1) {
            return createResponseInvalidTransparentWithStatus(req, { message: "Invalid videohub ID for creation.", status: 400 });
        }

        videohub.name = videohub.name.trim();
        await getPrisma().videohub.create({
            data: {
                name: videohub.name,
                ip: videohub.ip,
                latitude: videohub.latitude,
                longitude: videohub.longitude,
                version: videohub.version,
            }
        });

        // also add outputs to admin
        await getPrisma().roleOutput.createMany({
            data: videohub.outputs.map(output => {
                return { output_id: output.id, role_id: ROLE_ADMIN_ID, videohub_id: videohub.id }
            })
        });

        return createResponseValid(req);

    } else { // update existing videohub
        const requestData = await getRequestBaseData(req, slug, { allowNone: false }); // dont allow none, since existing
        if (requestData.response != undefined) {
            return requestData.response;
        }

        const videohub: IVideohub = requestData.videohub as IVideohub;
        if (slug.length < 2) { // update existing videohub
            const hasPerms = await checkServerPermission(req, PERMISSION_VIDEOHUB_EDIT);
            if (hasPerms != null) {
                return hasPerms;
            }

            const videohubData = await req.json() as IVideohub;
            if (videohubData.id != videohub.id) {
                return createResponseInvalidTransparentWithStatus(req, { message: "Videohub ID doesn't match.", status: 400 });
            }

            videohubData.name = videohubData.name.trim();
            await getPrisma().videohub.update({
                where: {
                    id: videohubData.id,
                },
                data: {
                    ip: videohubData.ip,
                    name: videohubData.name,
                    latitude: videohubData.latitude,
                    longitude: videohubData.longitude,
                    version: videohubData.version,
                },
            });

            return createResponseValid(req);

        } else { // update other related
            switch (slug[1]) {
                case "default-input": {
                    const hasPerms = await checkServerPermission(req, PERMISSION_VIDEOHUB_EDIT);
                    if (hasPerms != null) {
                        return hasPerms;
                    }

                    const user: IUser | undefined = await getUserFromToken(req)
                    if (user != undefined) {
                        const data = await getOutputsFromRequest(req, user, videohub.id);
                        const outputs = data.outputs;
                        const inputs = data.inputs;

                        for (let i = 0; i < outputs.length; i++) {
                            const input: number | undefined = inputs[i] < 0 ? undefined : inputs[i]
                            const output = outputs[i]
                            await getPrisma().output.update({
                                where: {
                                    videohub_output: {
                                        id: output,
                                        videohub_id: videohub.id,
                                    }
                                },
                                data: {
                                    input_default_id: input,
                                }
                            });

                            updateDefaultInput(videohub.id, output, input)
                        }

                        return createResponseValid(req)
                    }

                    break;
                }

                case "scenes": { // update or create scene
                    const hasPerm = await checkServerPermission(req, PERMISSION_VIDEOHUB_SCENES_EDIT);
                    if (hasPerm != null) {
                        return hasPerm;
                    }

                  
                    if (slug.length < 3) { // create new scene
                        const pushButton: IScene = await req.json();
                        if (pushButton.id != -1) {
                            return createResponseInvalidTransparentWithStatus(req, { message: "Invalid scene creation ID", status: 400 });
                        }

                        const result: any = await getPrisma().scene.create({
                            data: {
                                videohub_id: videohub.id,
                                label: pushButton.label,
                                color: pushButton.color,
                                description: pushButton.description,
                                display: pushButton.display,
                                sorting: Number(pushButton.sorting),
                                user_id: await getUserIdFromToken(req),
                            }
                        });

                        // adjust ids
                        const arr: IRoutingUpdate[] = [];
                        for (const action of pushButton.actions) {
                            const create = {
                                scene_id: result.id,
                                videohub_id: videohub.id,
                                input_id: action.input_id,
                                output_id: action.output_id,
                            } as SceneAction;

                            const res: IRoutingUpdate = await getPrisma().sceneAction.create({
                                data: create
                            });

                            arr.push(res);
                        }

                        result.actions = arr;
                        return createResponseValid(req, result);
                    } else {
                        if (isNumeric(slug[2])) { // has scene in url?
                            const slugLength = checkSlugLength(req, 3, slug);
                            if (slugLength != null) {
                                return slugLength;
                            }

                            const sceneId = Number(slug[2]);
                            const canEdit = await checkCanEditButton(sceneId, req);
                            if (canEdit != null) {
                                return canEdit;
                            }

                            if (slug.length < 4) { // update existing scene, action segment missing
                                const body = await req.json() as IScene;
                                const r: Scene = await getPrisma().scene.update({
                                    where: {
                                        id: body.id,
                                    },
                                    data: {
                                        label: body.label,
                                        color: body.color,
                                        display: body.display,
                                        sorting: Number(body.sorting),
                                        description: body.description,
                                    }
                                });

                                const result: IScene = {
                                    ...r,
                                    actions: [],
                                    triggers: [],
                                    color: r.color || undefined,
                                };

                                // check actions
                                const existingActions: SceneAction[] = await getPrisma().sceneAction.findMany({
                                    where: {
                                        scene_id: body.id,
                                    }
                                });

                                const del: number[] = [];
                                existingActions.forEach(action => {
                                    if (body.actions.find(a => a.id === action.id) == undefined) {
                                        del.push(action.id);
                                    }
                                });

                                // delete no longer existing ones
                                await getPrisma().sceneAction.deleteMany({
                                    where: {
                                        id: {
                                            in: del
                                        }
                                    }
                                });

                                // update
                                for (const a of existingActions.filter(a => {
                                    return del.indexOf(a.id) === -1 && body.actions.find(aa => aa.id === a.id);
                                })) {
                                    const upd = body.actions.find(aa => aa.id === a.id);
                                    if (upd != undefined) {
                                        const r: IRoutingUpdate = await getPrisma().sceneAction.update({
                                            where: {
                                                id: a.id,
                                            },
                                            data: {
                                                input_id: upd.input_id,
                                                output_id: upd.output_id,
                                            }
                                        });

                                        result.actions.push(r);
                                    }
                                }

                                // create
                                body.actions
                                    .filter(a => a.id == -1 && result.actions.find(aa => aa.id === a.id) == undefined) // double check is creation (-1) and make sure it's not update
                                    .forEach(async action => {
                                        const create = {
                                            scene_id: result.id,
                                            videohub_id: videohub.id,
                                            input_id: action.input_id,
                                            output_id: action.output_id,
                                        } as SceneAction

                                        const rr: IRoutingUpdate = await getPrisma().sceneAction.create({
                                            data: create
                                        })

                                        result.actions.push(rr)
                                    });

                                return createResponseValid(req, result);

                            } else { // update other related
                                switch (slug[3]) {
                                    case "triggers": { // replace triggers
                                        const body: any = await req.json();
                                        const triggers: ISceneTrigger[] = body.triggers;
                                        const actions: IRoutingUpdate[] = body.actions;

                                        // delete old
                                        await getPrisma().sceneTrigger.deleteMany({
                                            where: {
                                                scene_id: sceneId,
                                            }
                                        });

                                        for (const trigger of triggers) {
                                            let r: SceneTrigger[] = [];
                                            // make sure day only once
                                            const days: Set<number> = new Set(trigger.days);

                                            for (const action of actions) {
                                                days.forEach(day => {
                                                    const date: Date = new Date(trigger.time);
                                                    setDayOfWeek(date, day);
                                                    removeSecondsFromDate(date);

                                                    let t: TriggerType;
                                                    if (trigger.type == "TIME") {
                                                        t = TriggerType.TIME;
                                                    } else if (trigger.type == "SUNRISE") {
                                                        t = TriggerType.SUNRISE;
                                                    } else {
                                                        t = TriggerType.SUNSET;
                                                    }

                                                    const obj: SceneTrigger = {
                                                        id: "",
                                                        scene_id: sceneId,
                                                        time: date,
                                                        type: t,
                                                        day: date.getUTCDay(),
                                                        videohub_id: action.videohub_id,
                                                        output_id: action.output_id,
                                                        action_id: action.id,
                                                    };

                                                    (obj as any).id = undefined;
                                                    r.push(obj);
                                                });
                                            }

                                            // save one to get id
                                            const len: number = r.length;
                                            if (len != 0) {
                                                // save first to get id
                                                const id = await getPrisma().sceneTrigger.create({
                                                    data: r[0]
                                                }).then(res => res.id);

                                                r.splice(0, 1);
                                                await getPrisma().sceneTrigger.createMany({
                                                    data: r.map(trigger => {
                                                        trigger.id = id
                                                        return trigger
                                                    })
                                                });
                                            }
                                        }

                                        await handleButtonReSchedule(videohub.id, sceneId);
                                        return createResponseValid(req);
                                    }

                                    default: break;
                                }
                            }
                        }
                    }

                    break;
                }

                default: break;
            }
        }
    }

    return createResponseInvalid(req);
}

async function getOutputsFromRequest(req: NextRequest, user: IUser, videohub: number): Promise<{ response?: NextResponse<ResponseData> | null, outputs: number[], inputs: number[] }> {
    return req.json().then(body => {
        const outputs: number[] = body.outputs
        const inputs: number[] = body.inputs;

        const hasParams = checkHasParams(req, outputs, inputs);
        if (hasParams != null) {
            return { response: hasParams, inputs: [], outputs: [] };
        }

        // check outputs 
        for (const outputId of outputs) {
            if (!hasRoleOutput(user.role, videohub, outputId)) {
                return { response: createResponseInvalid(req, "Contains outputs that the user's role doesn't have."), inputs: [], outputs: [] }
            }
        }

        return { inputs: inputs, outputs: outputs };
    });
}

export async function POST(req: NextRequest,
    { params }: { params: { slug?: string[] } }
) {
    const hasPerms = await checkServerPermission(req);
    if (hasPerms != null) {
        return hasPerms;
    }

    const user: IUser | undefined = await getUserFromToken(req)
    if (user != undefined) {

        const { slug } = params;
        if (slug != undefined && slug.length > 0) {

            if (isNumeric(slug[0])) { // videohub specific
                if (slug.length > 1) {
                    const videohub: IVideohub | undefined = getVideohub(Number(slug[0]));

                    if (videohub != undefined) {
                        switch (slug[1]) {
                            case "routing": {
                                const data = await getOutputsFromRequest(req, user, videohub.id);
                                return createResponseValid(req, await sendRoutingUpdate(videohub.id, data.outputs, data.inputs));
                            }

                            default: break;
                        }
                    }
                }
            }
        }
    }

    return createResponseInvalid(req);
}

export async function PATCH(req: NextRequest,
    { params }: { params: { slug?: string[] } }
) {
    const hasPerms = await checkServerPermission(req);
    if (hasPerms != null) {
        return hasPerms;
    }

    const { slug } = params;
    if (slug != undefined && slug.length > 3 && isNumeric(slug[0])) {

        const videohub: Videohub | undefined = getVideohubClient(Number(slug[0]));
        if (videohub != undefined) {

            switch (slug[1]) {
                case "scenes": {
                    if (isNumeric(slug[2])) {
                        const scene: Button | undefined = getScheduledButton(videohub.getId(), Number(slug[2]));
                        if (scene == undefined) {
                            return createResponseInvalidTransparentWithStatus(req, { message: "Scene does not exist or isn't scheduled.", status: 404 });
                        }

                        const canEdit = await checkCanEditButton(scene.id, req);
                        if (canEdit != null) {
                            return canEdit;
                        }

                        switch (slug[3]) {
                            case "cancel": {
                                const cancel = (await req.json() as ICancelScheduledSceneRequest).cancel;
                                const hasParams = checkHasParams(req, cancel);
                                if (hasParams != null) {
                                    return hasParams;
                                }

                                videohub.cancelScheduledButton(scene, cancel);
                                return createResponseValid(req, { result: true })
                            }

                            default: break;
                        }
                    }

                    break;
                }

                default: break;
            }
        }
    }

    return createResponseInvalid(req);
}

interface RequestInfo {
    videohub?: IVideohub,
    response?: NextResponse<ResponseData>,
}

async function getRequestBaseData(req: NextRequest, slug?: string[], options?: { allowNone: boolean }): Promise<RequestInfo> {
    return await checkServerPermission(req).then(hasPerms => {
        if (hasPerms != null) {
            return { response: hasPerms };
        }

        if (slug != undefined && slug.length > 0) {
            const one = slug[0];
            if (isNumeric(one)) { // get single videohub
                const videohub: IVideohub | undefined = getVideohub(Number(one));
                if (videohub == undefined) {
                    return { response: createResponseInvalidTransparentWithStatus(req, { message: "Videohub doesn't exist.", status: 400 }) };
                }

                return { videohub: videohub };
            }
        }

        if (options?.allowNone) {
            return {};
        } else {
            return { response: createResponseInvalidTransparentWithStatus(req, { message: "Invalid PID", status: 400 }) }
        }
    });
}

export async function DELETE(req: NextRequest,
    { params }: { params: { slug: string[] } }
) {
    const { slug } = params;
    const requestData = await getRequestBaseData(req, slug, { allowNone: false });
    if (requestData.response != undefined) {
        return requestData.response;
    }

    const slugLength = checkSlugLength(req, 2, slug);
    if (slugLength != null) {
        return slugLength;
    }

    switch (slug[1]) {
        case "scenes": {
            const hasPerm = await checkServerPermission(req, PERMISSION_VIDEOHUB_SCENES_EDIT);
            if (hasPerm != null) {
                return hasPerm;
            }

            const slugLength = checkSlugLength(req, 3, slug);
            if (slugLength != null) {
                return slugLength;
            }

            if (isNumeric(slug[2])) {
                const id: number = Number(slug[2]);
                const canEdit = await checkCanEditButton(id, req);
                if (canEdit != null) {
                    return canEdit;
                }

                await getPrisma().scene.delete({
                    where: {
                        id: id,
                    }
                });

                handleButtonDeletion(id);
                return createResponseValid(req);
            }

            break;
        }

        default: break;
    }

    return createResponseInvalid(req);
}

export async function GET(req: NextRequest,
    { params }: { params: { slug?: string[] } }
) {
    const { slug } = params;
    if (slug == undefined || slug.length < 1) { // get videohubs
        return createResponseValid(req, retrieveVideohubsServerSide());
    }

    const requestData = await getRequestBaseData(req, slug, { allowNone: true });
    if (requestData.response != undefined) {
        return requestData.response;
    }

    if (requestData.videohub != undefined) { // get single videohub
        const videohub: IVideohub = requestData.videohub;
        if (slug.length < 2) {
            return createResponseValid(req, videohub);
        }

        switch (slug[1]) {
            case "scenes": {
                if (slug.length < 3) {
                    return createResponseValid(req, await retrievePushButtonsServerSide(req, videohub.id));
                }

                switch (slug[2]) {
                    case "scheduled": {
                        return createResponseValid(req, retrieveScheduledButtons(videohub.id, await getUserIdFromToken(req)))
                    }

                    default: {
                        if (isNumeric(slug[2])) {
                            const scene: Button | undefined = getScheduledButton(videohub.id, Number(slug[2]));
                            if (scene == undefined) {
                                return createResponseInvalidTransparentWithStatus(req, { message: "Scene does not exist or isn't scheduled.", status: 404 });
                            }

                            const canEdit = await checkCanEditButton(scene.id, req, false);
                            if (canEdit != null) {
                                return canEdit;
                            }

                            const slugLength = checkSlugLength(req, 4, slug);
                            if (slugLength != null) {
                                return slugLength;
                            }

                            switch (slug[3]) {
                                case "execute": {
                                    return createResponseValid(req, { result: await executeButton(videohub.id, scene.id) });
                                }

                                default: break;
                            }
                        }

                        break;
                    }
                }

                break;
            }

            default: break;
        }

    } else {
        switch (slug[0]) {
            case "view-data": { // get view data
                const videohub = req.nextUrl.searchParams.get("videohub");
                let selected: IVideohub | undefined = videohub ? getVideohub(Number(videohub)) : undefined;
                const hubs: IVideohub[] = retrieveVideohubsServerSide();

                if (selected == undefined) {
                    if (hubs.length != 0) {
                        selected = hubs[0];
                    }
                }

                const userId: string = await getUserIdFromToken(req)
                let buttons: any[]
                let scheduled: IUpcomingScene[]
                if (selected != undefined) {
                    buttons = await retrievePushButtonsServerSide(req, selected.id)
                    scheduled = retrieveScheduledButtons(selected.id, userId)
                } else {
                    buttons = []
                    scheduled = []
                }

                return createResponseValid(req, {
                    user: JSON.parse(JSON.stringify(await retrieveUserServerSide(userId))),
                    videohubs: JSON.parse(JSON.stringify(hubs)),
                    videohub: selected ? selected.id : 0,
                    scenes: JSON.parse(JSON.stringify(buttons)),
                    upcomingScenes: JSON.parse(JSON.stringify(scheduled))
                } as ViewData);
            }

            case "activities": {
                return createResponseValid(req, await getVideohubActivityServerSide())
            }

            default: break;
        }
    }

    return createResponseInvalid(req)
}