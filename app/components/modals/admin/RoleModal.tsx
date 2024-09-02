import { Input, InputProps, Label, useId } from "@fluentui/react-components";
import React from "react";
import { InputModal } from "../InputModalNew";
import { getRequestHeader } from "@/app/util/fetchutils";
import { IRole } from "@/app/authentification/interfaces";
import { useTranslations } from "next-intl";

interface Props {
    role?: IRole,
    roles: IRole[],
    trigger: JSX.Element,
    onRoleCreate?: (role: IRole) => void,
    onRoleUpdate?: (role: IRole) => void,
}

export const RoleModal = (props: Props) => {
    const inputIdIP = useId('ip');
    const t = useTranslations('RoleEditModal');
    const [name, setName] = React.useState<string>("");

    const onChangeName: InputProps['onChange'] = (_ev, data) => {
        if (data.value.length < 32) {
            setName(data.value);
        }
    };

    return (
        <InputModal
            trigger={props.trigger}
            title={props.role == undefined ? t("title.create") : t("title.edit")}
            handleSubmit={function (): Promise<string | undefined> {
                if (name == undefined) {
                    return Promise.resolve("You must provide a name.")
                }

                if (name.length == 0 || name.length > 32) {
                    return Promise.resolve("The name must be between 1 and 32 characters long.")
                }

                for (const role of props.roles) {
                    if (role.name === name) {
                        return Promise.resolve("A role with this name already exists.")
                    }
                }

                let role: IRole;
                let create: boolean;
                if (props.role == undefined) {
                    role = { id: -1, name: name, outputs: [], permissions: [], editable: true };
                    create = true
                } else {
                    role = props.role;
                    role.name = name;
                    create = false
                }

                return fetch('/api/roles', getRequestHeader("PUT", role)).then(async res => {
                    const json = await res.json();

                    const resRole: IRole = { id: json.id, name: json.name, outputs: role.outputs, permissions: role.permissions, editable: json.editable }
                    if (create) {
                        if (props.onRoleCreate != undefined) {
                            props.onRoleCreate(resRole)
                        }
                    } else {
                        if (props.onRoleUpdate != undefined) {
                            props.onRoleUpdate(resRole)
                        }
                    }

                    return undefined;
                })
            }}>
            <div className="flex flex-col">
                <Label htmlFor={inputIdIP}>{t("fields.name")}</Label>
                <Input value={name} onChange={onChangeName} id={inputIdIP} />
            </div>
        </InputModal >
    )
}