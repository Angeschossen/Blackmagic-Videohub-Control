import { Input, InputProps, Label, useId } from "@fluentui/react-components";
import React from "react";
import { InputModal } from "./InputModalNew";
import { getRequestHeader } from "@/app/util/fetchutils";
import { IVideohub } from "@/app/interfaces/videohub";
import { useTranslations } from "next-intl";
import { validateVideohub } from "@/app/validations/videohubValidations";

interface Props {
    videohubs: IVideohub[],
    edit?: IVideohub,
    onVideohubUpdate: (videohub: IVideohub) => void,
    open: boolean,
    trigger?: JSX.Element,
    onOpenChange?: (open: boolean) => void,
}

export const EditVideohubModal = (props: Props) => {
    const inputIdIP = useId('ip');
    const inputIdName = useId('name');
    const inputLatitude = useId('latitude');
    const inputLongitude = useId('longitude');

    const t = useTranslations('EditVideohubModal');
    const [ip, setIP] = React.useState(props.edit?.ip || "");
    const [name, setName] = React.useState(props.edit?.name || "");
    const [latitude, setLatitude] = React.useState(props.edit?.latitude || 0);
    const [longitude, setLongitude] = React.useState(props.edit?.longitude || 0);

    const onChangeIP: InputProps['onChange'] = (_ev, data) => {
        setIP(data.value);
    };

    const onChangeName: InputProps['onChange'] = (_ev, data) => {
        setName(data.value);
    };

    const onChangeLatitude: InputProps['onChange'] = (_ev, data) => {
        setLatitude(Number(data.value));
    };

    const onChangeLongitude: InputProps['onChange'] = (_ev, data) => {
        setLongitude(Number(data.value));
    };

    return (
        <InputModal
            open={props.open}
            onOpenChange={props.onOpenChange}
            trigger={props.trigger}
            handleSubmit={async () => {
                let videohubValidation = validateVideohub(props.videohubs, ip, latitude, longitude, name, props.edit);
                if (videohubValidation.error != undefined) {
                    return Promise.resolve(videohubValidation.error);
                }

                await fetch('/api/videohubs', getRequestHeader("POST", videohubValidation.result)).then(async res => {
                    if (res.status === 200) {
                        props.onVideohubUpdate(await res.json());
                    }
                })
            }}
            title={t("title")}>
            <div className="flex flex-col">
                <Label htmlFor={inputIdIP}>{t("fields.ip")}</Label>
                <Input required value={ip} onChange={onChangeIP} id={inputIdIP} />
            </div>
            <div className="flex flex-col">
                <Label htmlFor={inputIdName}>{t("fields.name.title")}</Label>
                <Input value={name} placeholder={t("fields.name.placeholder")} onChange={onChangeName} id={inputIdName} />
            </div>
            <div className="flex flex-col">
                <Label htmlFor={inputLatitude}>{t("fields.latitude")}</Label>
                <Input required type="number" onChange={onChangeLatitude} id={inputLatitude}></Input>
            </div>
            <div className="flex flex-col">
                <Label htmlFor={inputLongitude}>{t("fields.longitude")}</Label>
                <Input required type="number" onChange={onChangeLongitude} id={inputLongitude}></Input>
            </div>
        </InputModal>
    )
}