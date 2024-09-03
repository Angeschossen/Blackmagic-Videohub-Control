import { IIconProps } from "@fluentui/react";
import { Menu, MenuButton, MenuItem, MenuItemRadio, MenuList, MenuPopover, MenuProps, MenuTrigger } from "@fluentui/react-components";
import { AddRegular } from "@fluentui/react-icons";
import React from "react";
import { EditVideohubModal } from "../modals/EditVideohubModalNew";
import { IVideohub } from "@/app/interfaces/videohub";
import { getRandomKey } from "@/app/util/commonutils";
import { PERMISSION_VIDEOHUB_EDIT } from "@/app/authentification/permissions";
import { useClientSession } from "@/app/authentification/client-auth";
import { getVideohubFromArray } from "@/app/videohubs/VideohubView";
import { useTranslations } from "next-intl";


interface InputProps {
    videohubs: IVideohub[],
    onSelectVideohub: (videohub: IVideohub) => void,
}

export const SelectVideohub = (props: {
    videohubs: IVideohub[],
    selected?: IVideohub,
    onSelectVideohub: (videohub: IVideohub) => void,
}) => {
    const [modalKey, setModalKey] = React.useState(getRandomKey());
    const [open, setOpen] = React.useState(false);
    const t = useTranslations('VideohubSelection');
    const canEdit: boolean = useClientSession(PERMISSION_VIDEOHUB_EDIT);

    const onChange: MenuProps['onCheckedValueChange'] = (e, {
        name,
        checkedItems
    }) => {
        if (checkedItems.length != 1) {
            throw new Error("Expected one selected item");
        }

        const id = Number(checkedItems[0]);
        const videohub = getVideohubFromArray(props.videohubs, id);
        if (videohub == undefined) {
            throw new Error("Invalid dropdown items");
        }

        props.onSelectVideohub(videohub);
    };

    return (
        <>
            <Menu>
                <MenuTrigger>
                    <MenuButton>{props.selected == undefined ? t("button") : props.selected.name}</MenuButton>
                </MenuTrigger>
                <MenuPopover>
                    <MenuList checkedValues={{ select: props.selected == undefined ? [] : [props.selected.id.toString()] }}
                        onCheckedValueChange={onChange}>
                        {props.videohubs.map(videohub =>
                            <MenuItemRadio key={`videohub_${videohub.id}`}
                                name="select" value={videohub.id.toString()}>
                                {videohub.name}
                            </MenuItemRadio>
                        )}
                        <MenuItem
                            icon={<AddRegular />}
                            disabled={!canEdit}
                            onClick={() => {
                                setOpen(true)
                                setModalKey(getRandomKey())
                            }}>
                            {t("add")}
                        </MenuItem>
                    </MenuList>
                </MenuPopover>
            </Menu>
            <EditVideohubModal
                key={modalKey}
                open={open}
                onOpenChange={(state: boolean) => setOpen(state)}
                videohubs={props.videohubs}
                onVideohubUpdate={(videohub: IVideohub) => setOpen(false)} />
        </>
    )
}

export default SelectVideohub;