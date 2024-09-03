
import * as React from "react";

export const MessageBar = (props: { title: string, description: string, icon: React.ReactNode, hover: boolean, onClick: () => void }) => {
    return <div onClick={props.onClick} className={`flex space-x-1 items-center p-2 rounded-md border shadow-md${props.hover ? " hover:bg-gray-100" : ""}`}>
        {props.icon}
        <p className="break-all"><span className="font-bold">{props.title}: </span>{props.description}</p>
    </div>;
}