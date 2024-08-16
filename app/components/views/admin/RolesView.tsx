import { Stack } from "@fluentui/react";
import { Button, Tooltip } from "@fluentui/react-components";
import { TableCellLayout } from "@fluentui/react-components";
import { Delete16Regular } from '@fluentui/react-icons';
import { DataTable, DataTableColumn, DataTableItem } from "../../DataTableNew";
import { CheckboxChoice, CheckBoxModal } from "../../modals/admin/CheckBoxModal";
import { TOGGLEABLE_PERMISSIONS } from "@/app/authentification/permissions";
import { stackTokens } from "@/app/util/styles";
import { getRequestHeader } from "@/app/util/fetchutils";
import { IRole } from "@/app/authentification/interfaces";
import { IVideohub } from "@/app/interfaces/videohub";

interface Props {
    videohub?: IVideohub
    roles: IRole[],
    permissions: CheckboxChoice[],
    onRoleDeleted: (role: IRole) => void
}

const columns: DataTableColumn[] = [
    {
        label: 'Role',
    },
    {
        label: 'Actions'
    }
]

export function getRoleByName(roles: IRole[], name: string): IRole | undefined {
    for (const role of roles) {
        if (role.name === name) {
            return role
        }
    }

    return undefined
}

export function getRoleById(roles: IRole[], id?: number): IRole | undefined {
    if (id != undefined) {
        for (const role of roles) {
            if (role.id === id) {
                return role
            }
        }
    }

    return undefined
}

export const RolesView = (props: Props) => {
    function buildItems(): DataTableItem[] {
        const items: DataTableItem[] = [];

        for (const role of props.roles) {
            const key: string = role.name
            const cells: JSX.Element[] = [
                <TableCellLayout key={`${key}_name`}>{role.name}</TableCellLayout>,
                <TableCellLayout key={`${key}_actions`}>
                    <div className="md:flex justify-items-center">
                        <div className="mr-2 my-2">
                            <CheckBoxModal
                                title={"Permissions"}
                                description="Permissions are global and active for each videohub."
                                trigger={
                                    <Button disabled={!role.editable}>
                                        Permissions
                                    </Button>
                                }
                                handleSubmit={async function (checked: string[]): Promise<string | undefined> {
                                    return fetch(`/api/roles/${role.id}/permissions`, getRequestHeader("PUT", { permissions: checked })).then(res => {
                                        return undefined;
                                    });
                                }}
                                defaultChecked={role.permissions.filter(perm => TOGGLEABLE_PERMISSIONS.indexOf(perm) != -1)}
                                choices={props.permissions} />
                        </div>
                        <div className="mr-2 my-2">
                            <CheckBoxModal
                                title={"Outputs"}
                                description="Outputs are given for each specific videohub."
                                trigger={
                                    <Tooltip content={"Outputs are given for each videohub. You can change the videohub at the top."} relationship={"description"}>
                                        <Button disabled={!role.editable}>
                                            Outputs
                                        </Button>
                                    </Tooltip>
                                }
                                handleSubmit={async function (checked: string[]): Promise<string | undefined> {
                                    const videohub: IVideohub | undefined = props.videohub
                                    if (videohub == undefined) {
                                        return "No videohub setup yet."
                                    }

                                    const arr: number[] = checked.map(value => Number(value))
                                    return fetch(`/api/roles/${role.id}/outputs`, getRequestHeader("PUT", { videohub_id: videohub.id, outputs: arr })).then(res => {
                                        return undefined;
                                    })
                                }}
                                defaultChecked={role.outputs.filter(output => output.videohub_id === props.videohub?.id).map(output => output.output_id.toString())}
                                choices={props.videohub?.outputs.map(output => {
                                    return { value: output.id.toString(), label: output.label };
                                }) || []} />
                        </div>
                        <div className="my-2">
                            <Button
                                color="#bc2f32"
                                icon={<Delete16Regular />}
                                disabled={!role.editable}
                                onClick={async () => {
                                    await fetch(`/api/roles/${role.id}`, getRequestHeader("DELETE")).then(res => {
                                        if (res.status === 200) {
                                            props.onRoleDeleted(role)
                                        }
                                    });
                                }}>
                                Delete
                            </Button>
                        </div>
                    </div>
                </TableCellLayout>
            ]

            items.push({ key: key, cells: cells })
        }

        return items;
    }

    return (
        <DataTable
            columns={columns}
            items={buildItems()} />
    );
}