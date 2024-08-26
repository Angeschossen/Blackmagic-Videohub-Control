import { IUser } from "../authentification/interfaces";
import { IScene, IUpcomingScene } from "./scenes";

export interface IVideohub {
    id: number,
    ip: string,
    name: string,
    latitude: number,
    longitude: number,
    version: string,
    inputs: IInput[],
    outputs: IOutput[],
    connected: boolean,
    lastRoutingUpdate?: Date,
}

export interface IRoutingUpdateCollection {
    videohubId: number,
    outputs: number[],
    inputs: number[],
    error?: string,
}

export interface IVideohubActivity {
    id: number,
    videohub_id: number,
    title: string,
    description?: string,
    time: Date,
    icon: string,
}

export interface RoutingUpdateResult {
    result: boolean,
    message?: string,
}

export interface ViewData {
    videohubs: IVideohub[],
    scenes: IScene[],
    videohub: number,
    upcomingScenes: IUpcomingScene[],
    user: IUser,
}

export interface IRoutingRequest {
    id: number,
    videohubId: number,
    outputs: number[],
    button: IScene,
    inputs: number[],
    result?: RoutingUpdateResult,
}

export interface IInput {
    id: number,
    label: string,
}

export interface IRoutingPair {
    output: number, 
    input: number,
}

export interface IOutput {
    id: number,
    input_id: number | null,
    input_default_id: number | null,
    label: string,
}