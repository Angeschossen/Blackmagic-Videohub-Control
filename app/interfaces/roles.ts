import { IRole, IUser } from "../authentification/interfaces";
import { IVideohub } from "./videohub";

export interface AdminViewData {
    videohubs: IVideohub[],
    users: IUser[],
    roles: IRole[],
    permissions: string[],
}