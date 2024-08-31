"use client"

import { Button } from '@fluentui/react-components';
import { AddRegular } from "@fluentui/react-icons";
import { IVideohub } from "../interfaces/videohub";
import { IRole, IUser } from "../authentification/interfaces";
import { RoleModal } from "../components/modals/admin/RoleModal";
import SelectVideohub from "../components/buttons/SelectVideohubNew";
import { RolesView } from "../components/views/admin/RolesView";
import { UsersView } from "../components/views/admin/UsersView";
import React from "react";
import { VideohubPage } from '../components/videohub/VideohubPage';
import { useTranslations } from 'next-intl';

export const AdminView = (props: {videohubs: IVideohub[], roles: IRole[], users: IUser[], permissions: string[]}) => {
    const [videohub, setVideohub] = React.useState<IVideohub | undefined>(props.videohubs.length > 0 ? props.videohubs[0]:undefined);
    const [roles, setRoles] = React.useState<IRole[]>(props.roles);
    const [users, setUsers] = React.useState<IUser[]>(props.users);
    const t = useTranslations('Administration');

    return (
        <VideohubPage videohub={videohub}>
            <div className='mt-5'>
                <div className='mt-5'>
                    <SelectVideohub
                        videohubs={props.videohubs}
                        onSelectVideohub={(videohub: IVideohub) => setVideohub(videohub)} />
                </div>
                <h1 className='text-3xl font-bold mt-5'>{t("roles.title")}</h1>
                <div className='mt-1'>
                    <RoleModal
                        roles={roles}
                        trigger={
                            <Button
                                icon={<AddRegular />}>
                                {t("roles.add")}
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
                        permissions={props.permissions.map(perm => {
                            return { value: perm, label: perm }
                        })}
                        onRoleDeleted={(role: IRole) => {
                            const arr = [...roles]
                            arr.splice(arr.indexOf(role), 1)
                            setRoles(arr)
                        }}
                    />
                </div>
                <h1 className='text-3xl font-bold mt-5'>{t("users")}</h1>
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

