import { getColorFromString, Label, Stack } from "@fluentui/react";
import { Accordion, AccordionHeader, AccordionItem, AccordionPanel, Button, Dropdown, Input, InputProps, Option, Switch, Textarea, TextareaOnChangeData, useId } from "@fluentui/react-components";
import { Field } from "@fluentui/react-components";
import { DeleteRegular, SlideHideRegular, TextboxRegular, VideoSwitchRegular } from "@fluentui/react-icons";
import React from "react";
import { PickColor } from "../../input/ColorPicker";
import { InputState } from "../../input/HandledInputField";
import { InputModal } from "../InputModalNew";
import { getRandomKey } from "@/app/util/commonutils";
import { useGetClientId } from "@/app/authentification/client-auth";
import { getRequestHeader } from "@/app/util/fetchutils";
import { IRoutingUpdate, IScene } from "@/app/interfaces/scenes";
import { IVideohub } from "@/app/interfaces/videohub";
import { hasRoleOutput, IUser } from "@/app/authentification/interfaces";
import { AddRegular } from "@fluentui/react-icons";
import { Scene, SceneAction } from "@prisma/client";
import { useTranslations } from "next-intl";

interface Props {
    onButtonUpdate: (button: IScene, action: "create" | "update" | "delete") => void
    videohub: IVideohub,
    button?: IScene,
    buttons: IScene[],
    trigger: JSX.Element,
    user: IUser,
}

interface Routing {
    actionId?: number,
    input?: number,
    output?: number,
}

function getIdFromValue(ids: { label: string, id: number }[], value: string) {
    for (const entry of ids) {
        if (entry.label === value) {
            return entry.id
        }
    }

    throw Error("Value from name not found")
}

const RoutingComponent = (props: {
    num: number,
    videohub: IVideohub,
    routing: Routing,
    onSelectOutput: (index?: number) => void,
    onSelectInput: (index?: number) => void,
    onDelete: () => void,
    user: IUser,
}) => {
    const key: string | number = props.routing.actionId?.toString() || getRandomKey()
    const inputKey = `${key}_input`
    const outputKey = `${key}_output`
    const t = useTranslations('SceneEditModal');

    const out = props.routing.output == undefined ? undefined : props.videohub.outputs[props.routing.output].label;
    const inp = props.routing.input == undefined ? undefined : props.videohub.inputs[props.routing.input].label;

    return (
        <div className="flex flex-col">
            <div>
                <h3 className="float-left font-bold">#{props.num}</h3>
                <Button
                    className="float-right"
                    size="small"
                    icon={<DeleteRegular />}
                    onClick={() => props.onDelete()}
                />
            </div>
            <Label htmlFor={outputKey}>{t("sections.routings.fields.output.title")}</Label>
            <Dropdown
                style={{ minWidth: 'auto' }}
                key={outputKey}
                defaultSelectedOptions={out == undefined ? [] : [out]}
                defaultValue={out}
                placeholder={t("sections.routings.fields.output.placeholder")}
                onOptionSelect={(_event: any, data: any) => {
                    props.onSelectOutput(getIdFromValue(props.videohub.outputs, data.optionValue))
                }}>
                {props.videohub.outputs.filter(output => hasRoleOutput(props.user.role, props.videohub.id, output.id)).map(output =>
                    <Option key={`output_${output.id}`} value={output.label}>
                        {output.label}
                    </Option>)}
            </Dropdown>
            <Label htmlFor={inputKey}>{t("sections.routings.fields.input.title")}</Label>
            <Dropdown
                style={{ minWidth: 'auto' }}
                key={inputKey}
                defaultSelectedOptions={inp == undefined ? [] : [inp]}
                defaultValue={inp}
                placeholder={t("sections.routings.fields.input.placeholder")}
                onOptionSelect={(_event: any, data: any) => {
                    props.onSelectInput(getIdFromValue(props.videohub.inputs, data.optionValue))
                }}>
                {props.videohub.inputs.map(input =>
                    <Option key={`input_${input.id}`} value={input.label}>
                        {input.label}
                    </Option>)}
            </Dropdown>
        </div>
    )
}

export const EditPushButtonModal = (props: Props) => {
    const inputNameId = useId('input_name')
    const inputSortingId = useId('input_sorting')
    const inputDescriptionId = useId('input_description')
    const inputDisplayId = useId('display')
    const userId = useGetClientId()
    const t = useTranslations('SceneEditModal');

    const [name, setName] = React.useState<InputState>({ value: props.button?.label || "" })
    const [routings, setRoutings] = React.useState<Routing[]>(props.button?.actions.map(action => createRouting(action)) || [createRouting(undefined)])
    const [description, setDescription] = React.useState<InputState>({ value: props.button?.description || "" })
    const [color, setColor] = React.useState(props.button?.color)
    const [sorting, setSorting] = React.useState<InputState>({ value: props.button?.sorting.toString() || "0" })

    const [display, setDisplay] = React.useState(props.button == undefined ? true : props.button.display)
    const onDisplayChange = React.useCallback(
        (ev: { currentTarget: { checked: any; }; }) => {
            setDisplay(ev.currentTarget.checked);
        },
        [setDisplay],
    );

    const onChangeName: InputProps['onChange'] = (_ev, data) => {
        setName(validateLabel(data.value))
    }

    const onChangeSorting: InputProps['onChange'] = (_ev, data) => {
        setSorting(validateSorting(data.value))
    }

    const onChangeDescription = (ev: React.ChangeEvent<HTMLTextAreaElement>, data: TextareaOnChangeData) => {
        setDescription(validateDescription(data.value))
    }

    function createRouting(action?: SceneAction) {
        if (action == undefined) {
            return { actionId: undefined, input: undefined, output: undefined }
        } else {
            return { actionId: action.id, input: action.input_id, output: action.output_id }
        }
    }

    function updateRouting(routing: Routing, output?: number, input?: number) {
        const arr = [...routings]
        arr[arr.indexOf(routing)] = { actionId: routing.actionId, output: output, input: input }
        setRoutings(arr)
    }

    function removeRouting(routing: Routing) {
        const arr = [...routings]
        arr.splice(arr.indexOf(routing), 1)
        setRoutings(arr)
    }

    function validateDescription(value: string): InputState {
        if (value.length > 75) {
            return { value: value, validation: { state: "error", message: "Description must be between 0 and 75 characters long." } }
        }

        return { value: value, validation: { state: "success", message: "Input is valid." } }
    }

    function validateSorting(value: string): InputState {
        const sorting = Number(value)
        return sorting < 0 ? {
            value: 0,
            validation: {
                state: "error",
                message: "Sorting can't be lower than 0."
            }
        } : {
            value: sorting,
            validation: {
                state: "success",
                message: "Input is valid"
            }
        }
    }

    function validateLabel(name: string): InputState {
        const input = name.trim().toLocaleLowerCase()
        if (input.length == 0 || input.length > 32) {
            return { value: name, validation: { state: "error", message: "Name must be between 1 and 32 characters." } }
        }

        for (const b of props.buttons) {
            if (b.label.toLowerCase() === input && b.id != props.button?.id) {
                return { value: name, validation: { state: "error", message: "A button with this name already exists." } }
            }
        }

        return { value: name, validation: { state: "success", message: "Input is valid." } }
    }

    // InputField: Name, Description, Sorting
    return (
        <InputModal
            title={props.button == undefined ? t("title.create") : t("title.edit")}
            trigger={props.trigger}
            additionalTrigger={props.button != undefined ?
                <Button icon={<DeleteRegular />} style={{ backgroundColor: '#ed2b2b' }} onClick={async () => {
                    const button = props.button
                    if (button != undefined) {
                        await fetch(`/api/videohubs/${button.videohub_id}/scenes/${button.id}`, getRequestHeader("DELETE")).then(async (res) => {
                            if (res.status === 200) {
                                props.onButtonUpdate(button, "delete")
                            }
                        })
                    }
                }}>
                    Delete
                </Button>
                : undefined}
            handleSubmit={async () => {
                const actions: IRoutingUpdate[] = []
                for (const action of routings) {
                    if (action.input == undefined || action.output == undefined) {
                        continue
                    }

                    actions.push({
                        id: action.actionId || -1,
                        input_id: action.input, output_id: action.output,
                        scene_id: props.button?.id || -1,
                        videohub_id: props.videohub.id,
                    })
                }

                if (actions.length != 0) {
                    const button: IScene = {
                        id: props.button?.id || -1,
                        videohub_id: props.videohub.id,
                        label: name.value,
                        actions: actions,
                        sorting: sorting.value,
                        display: display,
                        color: color,
                        description: description.value,
                        user_id: userId,
                        triggers: props.button?.triggers || [],
                    }

                    const result = await fetch(`/api/videohubs/${button.videohub_id}/scenes${button.id == -1 ? '' : `/${button.id}`}`, getRequestHeader("PUT", button))
                    if (result.status === 200) {
                        const r: Scene = await result.json()
                        const buttonNew = {
                            ...r,
                            triggers: props.button?.triggers || [],
                            actions: (r as any).actions,
                            color: r.color || undefined,
                        }

                        props.onButtonUpdate(buttonNew, button.id == -1 ? "create" : "update")
                    }

                    return Promise.resolve(undefined)
                }

                return Promise.resolve("Please specify at leat one complete routing with an input and output.")
            }}>
            <Accordion multiple collapsible defaultOpenItems={[1, 3]}>
                <AccordionItem value={1}>
                    <AccordionHeader size="large" icon={<TextboxRegular />}>{t("sections.general.title")}</AccordionHeader>
                    <AccordionPanel>
                        <div className="space-y-3">
                            <div className="flex flex-col">
                                <Label htmlFor={inputNameId}>{t("sections.general.fields.name")}</Label>
                                <Input
                                    required
                                    value={name.value as string}
                                    onChange={onChangeName}
                                    id={inputNameId} />
                            </div>
                            <div className="flex flex-col">
                                <Label htmlFor={inputDescriptionId}>{t("sections.general.fields.description")}</Label>
                                <Textarea
                                    value={description.value as string}
                                    onChange={onChangeDescription}
                                    id={inputDescriptionId} />
                            </div>
                        </div>
                    </AccordionPanel>
                </AccordionItem>
                <AccordionItem value={2}>
                    <AccordionHeader size="large" icon={<SlideHideRegular />}>{t("sections.display.title")}</AccordionHeader>
                    <AccordionPanel>
                        <Label htmlFor={inputDisplayId}>{t("sections.display.fields.show")}</Label>
                        <Switch
                            checked={display}
                            id={inputDisplayId}
                            onChange={onDisplayChange}
                        />
                        <Label htmlFor={inputSortingId}>{t("sections.display.fields.sorting")}</Label>
                        <Field id={inputSortingId}>
                            <Input
                                required
                                type="number"
                                value={sorting.value}
                                onChange={onChangeSorting} />
                        </Field>
                        <Label>{t("sections.display.fields.color")}</Label>
                        <PickColor
                            color={color == undefined ? undefined : getColorFromString(color)}
                            onChange={(color) => {
                                setColor(color.str)
                            }}
                        />
                    </AccordionPanel>
                </AccordionItem>
                <AccordionItem value={3}>
                    <AccordionHeader size="large" icon={<VideoSwitchRegular />}>{t("sections.routings.title")}</AccordionHeader>
                    <AccordionPanel>
                        <div className="flex flex-col space-y-3">
                            {routings.map((routing, index) =>
                                <div className="rounded-md border-2 border-gray-300 p-2 hover:bg-gray-50" key={`routing_${index}`}>
                                    <RoutingComponent
                                        num={index + 1}
                                        user={props.user}
                                        key={`routing_${index}`}
                                        videohub={props.videohub}
                                        routing={routing}
                                        onSelectOutput={function (index?: number | undefined): void {
                                            updateRouting(routing, index, routing.input)
                                        }} onSelectInput={function (index?: number | undefined): void {
                                            updateRouting(routing, routing.output, index)
                                        }}
                                        onDelete={() => {
                                            removeRouting(routing)
                                        }}
                                    />
                                </div>
                            )}
                            <Button
                                icon={<AddRegular />}
                                onClick={() => {
                                    const arr = [...routings]
                                    arr.push(createRouting(undefined))
                                    setRoutings(arr)
                                }}>
                                {t("sections.routings.add")}
                            </Button>
                        </div>
                    </AccordionPanel>
                </AccordionItem>
            </Accordion>
        </InputModal>
    );
}