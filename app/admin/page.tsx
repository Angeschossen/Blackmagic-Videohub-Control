"use client"

import { Button } from '@fluentui/react-components';
import { AddRegular } from "@fluentui/react-icons";
import { IVideohub } from "../interfaces/videohub";
import { IRole, IUser } from "../authentification/interfaces";
import { RoleModal } from "../components/modals/admin/RoleModal";
import SelectVideohub from "../components/buttons/SelectVideohubNew";
import { RolesView } from "../components/views/admin/RolesView";
import { UsersView } from "../components/views/admin/UsersView";
import { useEffect } from "react";
import React from "react";
import { AdminViewData } from "../interfaces/roles";
import { Loading } from "../components/common/LoadingScreen";
import { VideohubPage } from '../components/videohub/VideohubPage';

const Page = () => {
    const [videohubs, setVideohubs] = React.useState<IVideohub[] | undefined>();
    const [videohub, setVideohub] = React.useState<IVideohub | undefined>();
    const [roles, setRoles] = React.useState<IRole[]>([]);
    const [users, setUsers] = React.useState<IUser[]>([]);
    const [permissions, setPermissions] = React.useState<string[]>([]);

    useEffect(() => {
        fetch('/api/roles/getAdminViewData').then(res => res.json().then(json => {
            const r: AdminViewData = json;
            setVideohubs(r.videohubs);

            if (r.videohubs.length > 0) {
                setVideohub(r.videohubs[0]);
            }

            setRoles(r.roles);
            setUsers(r.users);
            setPermissions(r.permissions);
        }));
    }, []);

    if (videohubs == undefined) {
        return <Loading />;
    }

    return (
        <VideohubPage videohub={videohub}>
            <div className='mt-5'>
                <div className='mt-5'>
                    <SelectVideohub
                        videohubs={videohubs}
                        onSelectVideohub={(videohub: IVideohub) => setVideohub(videohub)} />
                </div>
                <h1 className='text-3xl font-bold mt-5'>Roles</h1>
                <div className='mt-1'>
                    <RoleModal
                        roles={roles}
                        trigger={
                            <Button
                                icon={<AddRegular />}>
                                Add Role
                            </Button>
                        }
                        onRoleCreate={(role: IRole) => {
                            const arr = [...roles]
                            arr.push(role)
                            setRoles(arr)
                        }}
                        onRoleUpdate={(role: IRole) => {
                            const arr = [...roles]
                            arr[arr.indexOf(role)] = role
                            setRoles(arr)
                        }}
                    />
                </div>
                <div className='mt-10'>
                    <RolesView
                        videohub={videohub}
                        roles={roles}
                        permissions={permissions.map(perm => {
                            return { value: perm, label: perm }
                        })}
                        onRoleDeleted={(role: IRole) => {
                            const arr = [...roles]
                            arr.splice(arr.indexOf(role), 1)
                            setRoles(arr)
                        }}
                    />
                </div>
                <h1 className='text-3xl font-bold mt-5'>Users</h1>
                <div className='mt-1'>
                    <UsersView
                        roles={roles}
                        users={users}
                        onUserDeleted={(user: IUser) => {
                            const arr = [...users]
                            arr.splice(arr.indexOf(user), 1)
                            setUsers(arr)
                        }} />
                </div>
            </div>
        </VideohubPage>
    )
};

export default Page;