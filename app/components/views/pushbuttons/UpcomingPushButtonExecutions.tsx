import React from "react";
import { getTriggerExportTimeWithoutDay } from "@/app/util/dateutil";
import { getRequestHeader } from "@/app/util/fetchutils";
import { IVideohub } from "@/app/interfaces/videohub";
import { ICancelScheduledSceneRequest, IUpcomingScene } from "@/app/interfaces/scenes";
import { MessageBar } from "../../MessageBar";
import { FaTrash } from "react-icons/fa";
import { IoIosCheckmarkCircle } from "react-icons/io";
import { useFormatter, useTranslations } from "next-intl";
import { TbLetterX } from "react-icons/tb";

async function handleScenceCancel(videohub: number, scene: number, cancel: boolean) {
    await fetch(`/api/videohubs/${videohub}/scenes/${scene}/cancel`, getRequestHeader("PATCH", { cancel: cancel } as ICancelScheduledSceneRequest));
}

export const ScheduledButtons = (props: { videohub: IVideohub, scheduledButtons: IUpcomingScene[] }) => {
    const t = useTranslations('ScheduledScenes');
    const format = useFormatter();

    if (props.scheduledButtons.length === 0) {
        return <></>
    }

    const button: IUpcomingScene = props.scheduledButtons[0]
    return (
        <MessageBar
            data-tooltip-target={"tooltip-animation"}
            icon={button.cancelled ?
                <TbLetterX onClick={() => {
                    handleScenceCancel(props.videohub.id, button.id, !button.cancelled);
                }} />
                :
                <IoIosCheckmarkCircle color="green" onClick={() => {
                    handleScenceCancel(props.videohub.id, button.id, !button.cancelled);
                }} />
            }
            title={button.cancelled ? t("cancelled") : t("scheduled")}
            description={t("description", { button: button.label, time: format.dateTime(new Date(button.time), { hour: "numeric", minute: "numeric" }) })} />
    );
}