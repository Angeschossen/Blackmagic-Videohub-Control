"use client"
import { Button } from "@fluentui/react-components";
import { AddRegular } from "@fluentui/react-icons";
import React, { useEffect } from "react";
import { IVideohub } from "../../interfaces/videohub";
import { IScene } from "../../interfaces/scenes";
import { IUser } from "../../authentification/interfaces";
import { VideohubPage } from "../../components/videohub/VideohubPage";
import { EditPushButtonModal } from "../../components/modals/pushbuttons/EditPushButtonModalNew";
import { PushButtonsTableView } from "../../components/views/pushbuttons/PushButtonsTableView";
import { Loading } from "../../components/common/LoadingScreen";
import { useGetClientId } from "../../authentification/client-auth";
import { useSearchParams } from "next/navigation";


const PushButtonListNew = () => {
    const searchParams = useSearchParams()
    const [videohub, setVideohub] = React.useState<IVideohub | null>(null)
    const [scenes, setScenes] = React.useState<IScene[]>([]);
    const [user, setUser] = React.useState<IUser | null>(null)
    const userId: string = useGetClientId();
    const videohubId = searchParams?.get("videohub")

    useEffect(() => {
        fetch(`/api/videohubs/${videohubId}`)
            .then(res => res.json().then(json => {
                setVideohub(json);
            }));

        if (videohubId != undefined && videohubId != null) {
            fetch(`/api/videohubs/${videohubId}/scenes`).then(res => res.json()).then(json => {
                setScenes(json)
            })
        }

        fetch(`/api/users/${userId}`).then(res => res.json()).then(json => {
            setUser(json)
        })
    }, [userId, videohubId]);

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

        setScenes(arr)
    }

    if (videohub == null || user == null) {
        return <Loading />;
    }

    return (
        <VideohubPage videohub={videohub}>
            <div className="my-5">
                <h1 className='text-3xl font-bold'>Scenes</h1>
                <div className='my-1'>
                    <EditPushButtonModal
                        user={user}
                        videohub={videohub}
                        buttons={scenes}
                        trigger={
                            <Button icon={<AddRegular />}>
                                Add
                            </Button>}
                        onButtonUpdate={onButtonUpdate} />
                    <div className="mt-10">
                        <PushButtonsTableView
                            user={user}
                            videohub={videohub}
                            buttons={scenes}
                            onButtonUpdate={onButtonUpdate} />
                    </div>
                </div>
            </div>
        </VideohubPage>
    )
}

export default PushButtonListNew