import { retrievePushButtonsServerSide, retrieveScheduledButtons, retrieveVideohubsServerSide } from "../api/videohubs/[[...slug]]/server-videohubs";
import { getVideohub } from "../backend/videohubs";
import { IScene, IUpcomingScene } from "../interfaces/scenes";
import { IVideohub } from "../interfaces/videohub";
import VideohubView from "./VideohubView";
import { IUser } from "../authentification/interfaces";
import { getUserServerSide } from "../authentification/server-auth";

const Page = async ({
    searchParams,
  }: {
    searchParams?: { [key: string]: string | string[] | undefined };
  }) => {
    const user: IUser = await getUserServerSide();
    const hubs: IVideohub[] = retrieveVideohubsServerSide();
    const { videohub } = searchParams ?? { videohub: "" };
    let selected: IVideohub | undefined = videohub != undefined ? getVideohub(Number(videohub)) : undefined;

    if (selected == undefined) {
        if (hubs.length != 0) {
            selected = hubs[0];
        }
    }

    let scenes: IScene[];
    let scheduled: IUpcomingScene[];
    if (selected != undefined) {
        scenes = await retrievePushButtonsServerSide(user.id, selected.id);
        scheduled = retrieveScheduledButtons(selected.id, user.id);
    } else {
        scenes = [];
        scheduled = [];
    }

    return <VideohubView videhubs={JSON.parse(JSON.stringify(hubs))} user={JSON.parse(JSON.stringify(user))} videohub={JSON.parse(JSON.stringify(selected))} scenes={JSON.parse(JSON.stringify(scenes))} upcomingScenes={JSON.parse(JSON.stringify(scheduled))} />
}

export default Page;