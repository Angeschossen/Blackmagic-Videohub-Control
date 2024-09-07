
import * as React from "react";
import { IoIosCheckmarkCircle, IoIosWarning } from "react-icons/io";
import { IoWarningOutline } from "react-icons/io5";


interface InputProps {
    title: string, description: string, icon: React.ReactNode, hover: boolean, onClick: () => void
}

export const MessageBarWithIntent = (props: { intent: "error" | "success", title: string, description: string }) => {
    let color, borderColor;
    let icon;
    switch (props.intent) {
        case "error": {
            color = "bg-red-50";
            borderColor = "border-red-600";
            icon = <IoWarningOutline color="red"/>;
            break;
        }

        case "success": {
            color = "bg-green-50";
            borderColor = "border-green-600";
            icon = <IoIosCheckmarkCircle color="green" />;
            break;
        }

        default: throw new Error("Unhandled intent");
    }

    return <div className={`flex space-x-1 items-center p-2`}>
        {icon}
        <p className="break-all text-red-500"><span className="font-bold text-red-600">{props.title}: </span>{props.description}</p>
    </div>;
}

export const MessageBar = (props: InputProps) => {
    return <div onClick={props.onClick} className={`flex space-x-1 items-center p-2 rounded-md border shadow-md${props.hover ? " hover:bg-gray-100" : ""}`}>
        {props.icon}
        <p className="break-all"><span className="font-bold">{props.title}: </span>{props.description}</p>
    </div>;
}