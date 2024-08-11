import { Button, Dropdown, Option } from "@fluentui/react-components";
import { TableCellLayout } from "@fluentui/react-components";
import { Delete16Regular } from "@fluentui/react-icons";
import { DataTable, DataTableColumn, DataTableItem } from "../../DataTableNew";
import { getRoleById, getRoleByName } from "./RolesView";
import { getPostHeader } from "@/app/util/fetchutils";
import { IRole, IUser } from "@/app/authentification/interfaces";

interface Props {
    roles: IRole[],
    users: IUser[],
    onUserDeleted: (user: IUser) => void
}

const columns: DataTableColumn[] = [
    {
        label: 'Name',
    },
    {
        label: 'Role',
    },
    {
        label: 'Actions',
    }
]

export const UsersView = (props: Props) => {

    function buildItems(users: IUser[]): DataTableItem[] {
        const items: DataTableItem[] = [];

        for (const user of users) {
            const role: IRole | undefined = getRoleById(props.roles, user.role_id)
            const key: string = user.id
            const selected: string | undefined = role?.name;
            const cells: JSX.Element[] = [
                <TableCellLayout key={`${key}_username`}>{user.username}</TableCellLayout>,
                <TableCellLayout key={`${key}_role`}>
                    <Dropdown style={{ minWidth: 'auto' }} disabled={role != null && !role.editable} defaultSelectedOptions={selected ? [selected] : []} placeholder={selected || "Select a role"}
                        onOptionSelect={async (_event: any, data: any) => {
                            const name: string = data.optionValue;
                            const found: IRole | undefined = getRoleByName(props.roles, name)
                            if (found != undefined) {
                                await fetch('/api/users/setrole', getPostHeader({ user_id: user.id, role_id: found.id }));
                            }
                        }}>
                        {props.roles.filter(role => role.editable).map(role =>
                            <Option key={role.id.toString()} value={role.name} disabled={role.id === 0}>
                                {role.name}
                            </Option>)}
                    </Dropdown>
                </TableCellLayout>,
                <TableCellLayout key={`${key}_actions`}>
                    <Button
                        color="#bc2f32"
                        icon={<Delete16Regular />}
                        disabled={role != undefined && !role.editable}
                        onClick={async () => {
                            await fetch('/api/users/delete', getPostHeader({ id: user.id })).then(res => {
                                if (res.status === 200) {
                                    props.onUserDeleted(user)
                                }
                            });
                        }}>
                        Delete
                    </Button>
                </TableCellLayout>,
            ]

            items.push({ key: key, cells: cells })
        }


        return items;
    }

    return (
        <DataTable
            items={buildItems(props.users)}
            columns={columns} />
    );
}