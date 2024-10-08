import { SceneTrigger, TriggerType } from "@prisma/client";

export interface IScene {
    id: number,
    videohub_id: number,
    label: string,
    sorting: number,
    display: boolean,
    description: string,
    actions: IRoutingUpdate[],
    color?: string
    user_id: string,
    triggers: SceneTrigger[],
}

export interface IPatchTriggersSceneRequest {
    triggers: ISceneTrigger[],
    actions: IRoutingUpdate[]
}
export interface ICancelScheduledSceneRequest {
    cancel: boolean
}

export interface IUpcomingScene {
    id: number,
    cancelled: boolean,
    label: string,
    time: Date,
    userId: string,
    videohubId: number,
}

export interface ISceneTrigger {
    id: string,
    pushbutton_id: number,
    type: TriggerType,
    time: Date,
    days: number[]
}

export interface IRoutingUpdate {
    id: number,
    scene_id: number,
    videohub_id: number,
    output_id: number,
    input_id: number,
}