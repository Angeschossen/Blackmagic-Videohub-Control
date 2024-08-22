import React from "react";
import { getTriggerExportTimeWithoutDay } from "@/app/util/dateutil";
import { getRequestHeader } from "@/app/util/fetchutils";
import { IVideohub } from "@/app/interfaces/videohub";
import { ICancelScheduledSceneRequest, IUpcomingScene } from "@/app/interfaces/scenes";
import { MessageBar } from "../../MessageBar";
import { FaTrash } from "react-icons/fa";
import { IoIosCheckmarkCircle } from "react-icons/io";

async function handleScenceCancel(videohub: number, scene: number, cancel: boolean) {
    await fetch(`/api/videohubs/${videohub}/scenes/${scene}/cancel`, getRequestHeader("PATCH", { cancel: cancel } as ICancelScheduledSceneRequest));
}

export const ScheduledButtons = (props: { videohub: IVideohub, scheduledButtons: IUpcomingScene[] }) => {
    if (props.scheduledButtons.length === 0) {
        return <></>
    }

    const button: IUpcomingScene = props.scheduledButtons[0]
    return (
        <MessageBar
            data-tooltip-target={"tooltip-animation"}
            icon={button.cancelled ?
                <IoIosCheckmarkCircle color="green" onClick={() => {
                    handleScenceCancel(props.videohub.id, button.id, !button.cancelled);
                }} />
                :
                <FaTrash onClick={() => {
                    handleScenceCancel(props.videohub.id, button.id, !button.cancelled);
                }} />
            }
            title={button.cancelled ? "Cancelled" : "Scheduled"}
            description={`${button.label} at ${getTriggerExportTimeWithoutDay(new Date(button.time)).toLocaleTimeString()}`} />
    );
}