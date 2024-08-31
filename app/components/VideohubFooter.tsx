
import * as React from "react";
import { IVideohub } from "../interfaces/videohub";
import { IoIosCheckmarkCircle, IoIosInformationCircle, IoIosWarning } from "react-icons/io";
import { useTranslations } from "next-intl";

export const VideohubFooter = (p: {
    videohub?: IVideohub,
}) => {
    const t = useTranslations('VideohubHeader');

    let title, desc;
    let colorBg: string, colorBorder: string;
    let icon;
    if (p.videohub == undefined) {
        title = t("status.none.title")
        desc = t("status.none.description")
        colorBg = "bg-grey-50"
        colorBorder = "border-grey-600"
        icon = <IoIosInformationCircle />
    } else {
        if (p.videohub.connected) {
            title = t("status.connected.title")
            desc = t("status.connected.description");
            colorBg = "bg-green-50"
            colorBorder = "border-green-600"
            icon = <IoIosCheckmarkCircle color="green" />

        } else {
            title = t("status.disconnected.title")
            desc = t("status.disconnected.description")
            colorBg = "bg-red-50"
            colorBorder = "border-red-600"
            icon = <IoIosWarning />
        }
    }

    return <div className={`flex space-x-1 items-center p-2 rounded-md border ${colorBg} ${colorBorder}`}>
        {icon}
        <p className="break-all"><span className="font-bold">{title}: </span>{desc}</p>
    </div>
}