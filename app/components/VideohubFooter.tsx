
import * as React from "react";
import { IVideohub } from "../interfaces/videohub";
import { IoIosCheckmarkCircle, IoIosInformationCircle, IoIosWarning } from "react-icons/io";

interface InputProps {
    videohub?: IVideohub,
}

function getStatusComponent(videohub?: IVideohub) {
    let title, desc;
    let colorBg: string, colorBorder: string;
    let icon;
    if (videohub == undefined) {
        title = "None setup"
        desc = "No videohub setup yet."
        colorBg = "bg-grey-50"
        colorBorder = "border-grey-600"
        icon = <IoIosInformationCircle/>

    } else {
        if (videohub.connected) {
            title = "Connected"
            desc = "The videohub can be controlled.";
            colorBg = "bg-green-50"
            colorBorder = "border-green-600"
            icon = <IoIosCheckmarkCircle color="green" />

        } else {
            title = "Disconnected"
            desc = "The videohub is offline."
            colorBg = "bg-red-50"
            colorBorder = "border-red-600"
            icon = <IoIosWarning/>
        }
    }

    return <div className={`flex space-x-1 items-center p-2 rounded-md border ${colorBg} ${colorBorder}`}>
        {icon}
        <p className="break-all"><span className="font-bold">{title}: </span>{desc}</p>
    </div>

}

export const VideohubFooter = (p: InputProps) => {
    return getStatusComponent(p.videohub)
}