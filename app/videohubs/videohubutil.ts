import { IVideohub } from "../interfaces/videohub";

export function getVideohub(videohubs: IVideohub[], id: number): IVideohub | undefined {
    for (const videohub of videohubs) {
        if (videohub.id === id) {
            return videohub;
        }
    }

    return undefined
}