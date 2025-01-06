"use client"

import { IUser } from "@/app/authentification/interfaces"
import { SignOut } from "./SignOut";
import { useTranslations } from "next-intl";
import { Avatar } from "@fluentui/react-components";
import React from "react";
import {
    MenuList,
    MenuItem,
    Divider
} from "@fluentui/react-components";
import { DoorArrowLeftRegular } from '@fluentui/react-icons';
import { useRef } from 'react'
import { useClickOutside } from "@/app/util/hooks";

export const UserHeader = (props: { user: IUser }) => {
    const [showMenu, setShowMenu] = React.useState(false);
    const t = useTranslations('Header');
    const ref = useRef<HTMLDivElement>(null);
    useClickOutside(ref, () => {
        if (showMenu) {
            setShowMenu(false);
        }
    });

    return <div className="flex w-full mr-5 justify-between items-center py-2 px-3 rounded-md border shadow-md">
        <p className="font-bold">{t("welcome", { user: props.user.username })}</p>
        <div className="flex flex-row">
            <Avatar name={props.user.username} {...props}
                onClick={() => {
                    setShowMenu(!showMenu);
                }} />
            {showMenu && <div ref={ref} className="absolute mt-12 mr-4 right-0 border rounded-md">
                <MenuList>
                    <MenuItem>
                        <p>{t("user.name", { user: props.user.username })}</p>
                        <p>{t("user.role", { role: props.user.role?.name })}</p>
                    </MenuItem>
                    <Divider />
                    <MenuItem icon={<DoorArrowLeftRegular />}>
                        <SignOut />
                    </MenuItem>
                </MenuList>
            </div>}
        </div >
    </div>;
}