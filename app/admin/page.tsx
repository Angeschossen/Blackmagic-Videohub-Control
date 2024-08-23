import { retrievePermissionsServerSide, retrieveRolesServerSide } from "../api/roles/[[...slug]]/server-roles";
import { retrieveUsersServerSide } from "../api/users/[[...slug]]/server-users";
import { retrieveVideohubsServerSide } from "../api/videohubs/[[...slug]]/server-videohubs";
import { IVideohub } from "../interfaces/videohub";
import { AdminView } from "./AdminView";

const Page = async () => {
    const videohubs: IVideohub[] = retrieveVideohubsServerSide();
    return <AdminView videohubs={JSON.parse(JSON.stringify(videohubs))} roles={JSON.parse(JSON.stringify(retrieveRolesServerSide()))} users={JSON.parse(JSON.stringify(await retrieveUsersServerSide()))} permissions={retrievePermissionsServerSide()} />
}

export default Page;