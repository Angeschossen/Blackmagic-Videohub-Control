import { retrievePermissionsServerSide, retrieveRolesServerSide } from "../api/roles/[[...slug]]/server-roles";
import { retrieveUsersServerSide } from "../api/users/[[...slug]]/server-users";
import { retrieveVideohubsServerSide } from "../api/videohubs/[[...slug]]/server-videohubs";
import { IVideohub } from "../interfaces/videohub";
import { AdminView } from "./AdminView";

const Page = async ({
    searchParams,
}: {
    searchParams?: { [key: string]: string | string[] | undefined };
}) => {
    const { videohub } = searchParams ?? { videohub: "" }; // prevent static page build error

    const hubs: IVideohub[] = retrieveVideohubsServerSide();
    return <AdminView videohubs={JSON.parse(JSON.stringify(hubs))} roles={JSON.parse(JSON.stringify(retrieveRolesServerSide()))} users={JSON.parse(JSON.stringify(await retrieveUsersServerSide()))} permissions={JSON.parse(JSON.stringify(retrievePermissionsServerSide()))} />
}

export default Page;