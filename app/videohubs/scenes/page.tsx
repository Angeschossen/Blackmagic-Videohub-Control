import { IUser } from "@/app/authentification/interfaces";
import { PushButtonListNew } from "./ScenesView";
import { getUserServerSide } from "@/app/authentification/server-auth";
import { IVideohub } from "@/app/interfaces/videohub";
import { getVideohub } from "@/app/backend/videohubs";
import { retrievePushButtonsServerSide } from "@/app/api/videohubs/[[...slug]]/server-videohubs";

const Page = async ({
    searchParams,
  }: {
    searchParams?: { [key: string]: string | string[] | undefined };
  }) => {
    const { videohub } = searchParams ?? { videohub: "" };
    const user: IUser = await getUserServerSide();
    let selected: IVideohub | undefined = videohub != undefined ? getVideohub(Number(videohub)) : undefined;
    return <PushButtonListNew user={JSON.parse(JSON.stringify(user))} videohub={JSON.parse(JSON.stringify(selected))} scenes={selected == undefined ? [] : JSON.parse(JSON.stringify(await retrievePushButtonsServerSide(user.id, selected.id)))} />
}

export default Page;