
import * as React from "react";
import {
    MessageBar,
    MessageBarActions,
    MessageBarTitle,
    MessageBarBody,
    MessageBarIntent,
} from "@fluentui/react-components";
import { IVideohub } from "../interfaces/videohub";

interface InputProps {
    videohub?: IVideohub,
}

function getStatusComponent(videohub?: IVideohub) {
    let title, desc
    let intent: MessageBarIntent
    if (videohub == undefined) {
        title = "None setup"
        desc = "No videohub setup yet."
        intent = "info"
    } else {
        if (videohub.connected) {
            title = "Connected"
            desc = "The videohub is online and can be controlled.";
            intent = "success"
        } else {
            title = "Disconnected"
            desc = "The videohub is currently offline."
            intent = "warning"
        }
    }

    return <MessageBar intent={intent}>
        <MessageBarBody>
            <MessageBarTitle>{title}</MessageBarTitle>
            {desc}
        </MessageBarBody>
        <MessageBarActions>
        </MessageBarActions>
    </MessageBar>
}

export const VideohubFooter = (p: InputProps) => {
    return getStatusComponent(p.videohub)
}