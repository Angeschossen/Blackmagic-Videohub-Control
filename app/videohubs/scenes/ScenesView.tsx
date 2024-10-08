"use client"

import { Button } from "@fluentui/react-components";
import { AddRegular } from "@fluentui/react-icons";
import React from "react";
import { IVideohub } from "../../interfaces/videohub";
import { IScene } from "../../interfaces/scenes";
import { IUser } from "../../authentification/interfaces";
import { VideohubPage } from "../../components/videohub/VideohubPage";
import { EditPushButtonModal } from "../../components/modals/pushbuttons/EditPushButtonModalNew";
import { PushButtonsTableView } from "../../components/views/pushbuttons/PushButtonsTableView";
import { useTranslations } from "next-intl";


export const PushButtonListNew = (props: { videohub?: IVideohub, scenes: IScene[], user: IUser }) => {
    const [scenes, setScenes] = React.useState<IScene[]>(props.scenes);
    const t = useTranslations('Scenes');

    const onButtonUpdate = (button: IScene, action: "create" | "update" | "delete") => {
        const arr: IScene[] = [...scenes]

        switch (action) {
            case "create": {
                arr.push(button)
                break
            }

            case "update": {
                let found: boolean = false
                for (let i = 0; i < arr.length; i++) {
                    if (arr[i].id === button.id) {
                        arr[i] = button // update
                        found = true
                        break
                    }
                }

                if (!found) {
                    throw Error("Couldn't find matching button.")
                }

                break
            }

            case "delete": {
                arr.splice(arr.indexOf(button), 1)
                break
            }

            default: {
                throw Error(`Unhandled action: ${action}`)
            }
        }

        setScenes(arr);
    }

    if (props.videohub == undefined) {
        return <p className="flex flex-col justify-center h-screen">{t("none")}</p>;
    }

    return (
        <VideohubPage videohub={props.videohub}>
            <div className="my-5">
                <div className='my-1'>
                    <EditPushButtonModal
                        user={props.user}
                        videohub={props.videohub}
                        buttons={scenes}
                        trigger={
                            <Button icon={<AddRegular />}>
                                {t("add")}
                            </Button>}
                        onButtonUpdate={onButtonUpdate} />
                    <div className="mt-10">
                        <PushButtonsTableView
                            user={props.user}
                            videohub={props.videohub}
                            buttons={scenes}
                            onButtonUpdate={onButtonUpdate} />
                    </div>
                </div>
            </div>
        </VideohubPage>
    )
}