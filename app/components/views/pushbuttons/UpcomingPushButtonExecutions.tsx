import { CheckmarkRegular, ClockRegular, DeleteRegular } from "@fluentui/react-icons";
import React from "react";
import { AlertMessage } from "../../common/AlertMessage";
import { Tooltip } from "@fluentui/react-components";
import { getTriggerExportTimeWithoutDay } from "@/app/util/dateutil";
import { getPostHeader } from "@/app/util/fetchutils";
import { IVideohub } from "@/app/interfaces/videohub";
import { IUpcomingScene } from "@/app/interfaces/scenes";


export const ScheduledButtons = (props: { videohub: IVideohub, scheduledButtons: IUpcomingScene[] }) => {
    if (props.scheduledButtons.length === 0) {
        return <></>
    }

    const button: IUpcomingScene = props.scheduledButtons[0]
    return (
        <Tooltip content={""} relationship="description">
            <AlertMessage
                icon={<ClockRegular />}
                message={`${button.cancelled ? "Cancelled" : "Scheduled"}: ${button.label} at ${getTriggerExportTimeWithoutDay(new Date(button.time)).toLocaleTimeString()}`}
                action={
                    {
                        icon: button.cancelled ? <Tooltip content="Activate this routing update." relationship="description"><CheckmarkRegular /></Tooltip> : <Tooltip content={"Cancel this routing update."} relationship="description"><DeleteRegular /></Tooltip>,
                        onClick: async () => {
                            await fetch('/api/scenes/cancel', getPostHeader({ videohub_id: props.videohub.id, buttonId: button.id, cancel: !button.cancelled }))
                        }
                    }
                } />
        </Tooltip>
    )
}