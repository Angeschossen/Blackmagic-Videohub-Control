"use client"

import { Button, Switch, SwitchOnChangeData, Toaster, ToastIntent, Tooltip, useId, useToastController } from '@fluentui/react-components';
import { EditRegular } from '@fluentui/react-icons';
import { useRouter } from 'next/navigation';
import React, { useEffect, useRef } from 'react';
import { IScene, IUpcomingScene } from '../interfaces/scenes';
import { IOutput, IRoutingUpdateCollection, IVideohub } from '../interfaces/videohub';
import { IUser } from '../authentification/interfaces';
import { useViewType } from '../components/views/DesktopView';
import { useClientSession, useGetClientId } from '../authentification/client-auth';
import { sendToast } from '../components/common/AlertMessage';
import { PERMISSION_VIDEOHUB_SCENES_EDIT } from '../authentification/permissions';
import { VideohubPage } from '../components/videohub/VideohubPage';
import SelectVideohub from '../components/buttons/SelectVideohubNew';
import { OutputsView } from '../components/views/OutputsView';
import { ScheduledButtons } from '../components/views/pushbuttons/UpcomingPushButtonExecutions';
import { PushButtonsList } from '../components/views/pushbuttons/PushButtonsView';
import { useSocket } from '../providers/socket-provider';
import { useTranslations } from 'next-intl';
import { isNotificationGranted, requestNotificationPermission, showNotification } from '../util/desktopNotificationUtil';


export function getVideohubFromArray(videohubs: IVideohub[], id: number): IVideohub | undefined {
    for (const videohub of videohubs) {
        if (videohub.id === id) {
            return videohub;
        }
    }

    return undefined;
}

async function retrievePushButtonsClientSide(videohub: number): Promise<IScene[]> {
    return (await fetch(`/api/videohubs/${videohub}/scenes`).then()).json();
}

async function retrieveScheduledButtonsClientSide(videohub: number): Promise<IUpcomingScene[]> {
    return (await fetch(`/api/videohubs/${videohub}/scenes/scheduled`).then()).json()
}

function canEditPushButtons(canEditPushButtons: boolean, videohub?: IVideohub) {
    return videohub != undefined && canEditPushButtons
}


interface VideohubUpdate {
    data: IVideohub,
    reason: string,
    info: any
}

interface VideohubViewProps {
    videohubs: IVideohub[],
    videohub: number,
    pushbuttons: IScene[],
    user: IUser,
    scheduledButtons: IUpcomingScene[],
}

const VideohubView = (props: {
    videhubs: IVideohub[],
    videohub?: IVideohub,
    scenes: IScene[],
    upcomingScenes: IUpcomingScene[],
    user: IUser,
}) => {
    const userId: string = useGetClientId();
    const isDekstop = useViewType();

    const [selectInput, setSelectInput] = React.useState(false);
    const [routingUpdate, setRoutingUpdate] = React.useState<IRoutingUpdateCollection>();

    const [scenes, setScenes] = React.useState<IScene[]>(props.scenes);
    const [videohub, setVideohub] = React.useState<IVideohub | undefined>(props.videohub);
    const [videohubs, setVideohubs] = React.useState<IVideohub[]>(props.videhubs);
    const [upcomingScenes, setUpcomingScenes] = React.useState<IUpcomingScene[]>(props.upcomingScenes);
    const [outputs, setOutputs] = React.useState<IOutput[]>(videohub == undefined ? [] : videohub.outputs);

    const toasterId = useId("toaster");
    const { dispatchToast } = useToastController(toasterId);
    const canEdit: boolean = useClientSession(PERMISSION_VIDEOHUB_SCENES_EDIT);
    const router = useRouter();
    const { socket, isConnected } = useSocket();
    const t = useTranslations('Videohubs');
    const tRequestStatus = useTranslations('RequestStatus');

    const socketHandlerRef = useRef<{ videohubs?: IVideohub[], sendToast: (intent: ToastIntent, msg: string) => void, videohub?: IVideohub, onVideohubUpdate: (e: VideohubUpdate) => void, handleReceivedUpcomingScenes: (scenes: IUpcomingScene[]) => void }>({
        videohubs: undefined,
        sendToast(intent: ToastIntent, msg: string) {
            if (isNotificationGranted()) {
                showNotification("Videohubs", { body: msg });
            } else {
                sendToast(dispatchToast, intent, msg, 10 * 1000);
            }
        },
        onVideohubUpdate(e) {
            const videohubs = socketHandlerRef.current.videohubs;

            if (videohubs != undefined) {
                console.log(`Received videohub update: ${e}`);

                const vhub = getVideohubFromArray(videohubs, e.data.id);
                if (vhub != undefined) {
                    if (videohubs == undefined) {
                        throw new Error("Videohubs is undefined");
                    }

                    let index: number | undefined;
                    for (let i = 0; i < videohubs.length; i++) {
                        if (videohubs[i].id === e.data.id) {
                            index = i;
                            break;
                        }
                    }

                    if (index == undefined) {
                        throw new Error("Updated videohhub is not in collection");
                    }

                    const vhubs = [...videohubs]
                    vhubs[index] = e.data;
                    setVideohubs(vhubs);
                    setVideohub(e.data);
                    setOutputs(e.data.outputs);

                    switch (e.reason) {
                        case "connection_established": {
                            socketHandlerRef.current.sendToast("success", t("events.connection.established"))
                            break
                        }

                        case "connection_lost": {
                            socketHandlerRef.current.sendToast("warning", t("events.connection.lost"))
                            break
                        }

                        case "routing_update": {
                            const changes: any[] = e.info.changes

                            if (changes.length > 0) {
                                const input = e.data.inputs[changes[0].input].label, output = e.data.outputs[changes[0].output].label;
                                socketHandlerRef.current.sendToast("success", t("events.routingUpdate", { input: input, output: output, more: Math.max(changes.length - 1, 0) }))
                            }

                            break;
                        }

                        default:
                            break;
                    }

                    console.log("Updated videohub data.")
                }
            }
        },
        handleReceivedUpcomingScenes(scenes) {
            setUpcomingScenes(scenes.filter(scene => {
                return scene.userId === userId && scene.videohubId === socketHandlerRef.current.videohub?.id;
            }))
        },
    });

    useEffect(() => {
        if (routingUpdate?.error != undefined) {
            sendToast(dispatchToast, "error", tRequestStatus(`result.${routingUpdate.error}`), 60 * 1000)
        }
    }, [routingUpdate, dispatchToast]);

    useEffect(() => {
        socketHandlerRef.current.videohubs = videohubs;
    }, [videohubs]);

    useEffect(() => {
        socketHandlerRef.current.videohub = videohub;
    }, [videohub]);

    useEffect(() => {
        requestNotificationPermission();
    }, []);

    useEffect(() => {
        if (socket == null) {
            return;
        }

        const onVideohubUpdate = (e: VideohubUpdate) => {
            socketHandlerRef.current.onVideohubUpdate(e);
        }
        const channel: string = `videohubUpdate`;
        socket.on(channel, onVideohubUpdate);

        const onUpcomingScenes = (arr: IUpcomingScene[]) => {
            socketHandlerRef.current.handleReceivedUpcomingScenes(arr);
        }

        const upcomingScenes: string = `${channel}_scheduled`;
        socket.on(upcomingScenes, onUpcomingScenes);

        return () => {
            socket.off(channel, onVideohubUpdate);
            socket.off(upcomingScenes, onUpcomingScenes);
        }
    }, [socket]);

    async function onSelectVideohub(hub: IVideohub) {
        setVideohub(hub);
        setOutputs(hub.outputs)
        setScenes(await retrievePushButtonsClientSide(hub.id))
        setUpcomingScenes(await retrieveScheduledButtonsClientSide(hub.id))
    }

    return (
        <VideohubPage videohub={videohub}>
            <div className='my-5'>
                <SelectVideohub
                    videohubs={videohubs}
                    selected={videohub}
                    onSelectVideohub={(hub: IVideohub) => {
                        setVideohub(hub)
                        onSelectVideohub(hub);
                    }} />
                {videohub != undefined &&
                    <div className='my-10'>
                        <h1 className='text-3xl font-bold'>{t("routing.title")}</h1>
                        <div className='flex justify-end'>
                            <Switch labelPosition='before' label={t("routing.setInput")} onChange={(_ev, data: SwitchOnChangeData) => {
                                setSelectInput(data.checked)
                                setRoutingUpdate(undefined)
                            }} />
                        </div>
                        <OutputsView
                            selectInput={selectInput}
                            outputs={outputs}
                            user={props.user}
                            videohub={videohub}
                            onRoutingUpdate={(update: IRoutingUpdateCollection) => {
                                setRoutingUpdate(update);
                            }}
                        />
                        <div className='mt-10'>
                            <div className='flex justify-between'>
                                <h1 className='text-3xl font-bold my-1'>{t("scenes.title")}</h1>
                                <ScheduledButtons
                                    videohub={videohub}
                                    scheduledButtons={upcomingScenes}
                                />
                            </div>
                            <Tooltip content={t("scenes.edit.tooltip")} relationship="description">
                                <Button
                                    icon={<EditRegular />}
                                    disabled={!canEditPushButtons(canEdit, videohub)}
                                    onClick={() => {
                                        if (videohub == null) {
                                            return;
                                        }

                                        router.push(`../videohubs/scenes?videohub=${videohub.id}`);
                                    }}>
                                    {t("scenes.edit.button")}
                                </Button>
                            </Tooltip>
                            <div className='my-5'>
                                <PushButtonsList
                                    pushbuttons={scenes.filter(button => button.display)}
                                    videohub={videohub}
                                />
                            </div>
                        </div>
                    </div>}
            </div>
            <Toaster position={isDekstop ? "bottom-end" : "bottom"} limit={5} toasterId={toasterId} />
        </VideohubPage>
    )
}

export default VideohubView