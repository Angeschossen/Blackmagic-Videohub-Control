import { IVideohub } from "../interfaces/videohub";

export const validateVideohub = (videohubs: IVideohub[], ip: string, longitude: number, latitude: number, name?: string, edit?: IVideohub): {
    error?: string,
    result?: IVideohub,
} => {
    if (name != undefined) { // name can be left blank to get from videohub
        name = name.trim()

        if (name.length > 32 || name.length < 1) {
            return { error: "The name must be between 1 and 32 characters long." };
        }

        const lowerCase = name.toLocaleLowerCase();
        for (const b of videohubs) {
            if (b.name.toLowerCase() === lowerCase && b !== edit) {
                return { error: "A videohub with that name already exists." };
            }
        }
    }

    if (ip == undefined) {
        return { error: "You must provide an ip address." };
    }

    for (const b of videohubs) {
        if (b.ip === ip && b !== edit) {
            return { error: "A videohub with this ip address already exists." };
        }
    }

    const nameFinal: string = name == undefined ? ip : name;
    if (edit == undefined) {
        return { result: { id: -1, connected: false, inputs: [], outputs: [], version: 'unkown', ip: ip, name: nameFinal, longitude: longitude, latitude: latitude } };
    } else {
        edit.ip = ip;
        edit.name = nameFinal;
        edit.longitude = longitude;
        edit.latitude = latitude;
        return { result: edit };
    }
}