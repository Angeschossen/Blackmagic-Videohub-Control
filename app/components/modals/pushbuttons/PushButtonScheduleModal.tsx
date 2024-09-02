import { Label } from "@fluentui/react";
import { Button, Dropdown, Input, InputProps, Option, useId } from "@fluentui/react-components";
import { Field } from "@fluentui/react-components";
import { AddRegular, DeleteRegular } from "@fluentui/react-icons";
import React from "react";
import { InputState } from "../../input/HandledInputField";
import { InputModal } from "../InputModalNew";
import { TriggerType } from "@prisma/client";
import { convertDateToLocal } from "@/app/util/dateutil";
import { getRequestHeader } from "@/app/util/fetchutils";
import { IScene, ISceneTrigger } from "@/app/interfaces/scenes";
import { useTranslations } from "next-intl";

interface Day {
    label: string,
    value: number
}


/**
 * Assure format hh:mm not h:mm etc.
 * @param i value
 * @returns at least two 
 */
function correctTime(i: any): number {
    if (i < 10) {
        i = "0" + i;
    }
    return i;
}

const Trigger = (props: {
    trigger: ISceneTrigger,
    num: number,
    onSelectDay: (index: number) => void,
    onSelectType: (type: TriggerType) => void,
    onChangeTime: (value: string) => void,
    onDelete: () => void,
}) => {
    const [time, setTime] = React.useState<InputState>({ value: correctTime(props.trigger.time.getHours()) + ":" + correctTime(props.trigger.time.getMinutes()) })
    const [type, setType] = React.useState<TriggerType>(props.trigger.type)
    const t = useTranslations('SceneScheduleModal');

    const inputDaysId = useId('input_days')
    const inputTypeId = useId('input_type')
    const inputTimeId = useId('input_time')

    const days: Day[] = [
        {
            label: t("fields.days.values.sunday"),
            value: 0,
        },
        {
            label: t("fields.days.values.monday"),
            value: 1,
        },
        {
            label: t("fields.days.values.tuesday"),
            value: 2,
        },
        {
            label: t("fields.days.values.wednesday"),
            value: 3,
        },
        {
            label: t("fields.days.values.thursday"),
            value: 4,
        },
        {
            label: t("fields.days.values.friday"),
            value: 5,
        },
        {
            label: t("fields.days.values.saturday"),
            value: 6,
        }
    ];


    const onChangeTime: InputProps['onChange'] = (_ev, data) => {
        setTime({ value: data.value })
        props.onChangeTime(data.value)
    }

    function getDayFromValue(value: string) {
        for (const day of days) {
            if (day.label === value) {
                return day
            }
        }
    }

    // InputField: Time
    return (
        <div className="flex flex-col">
            <div>
                <h3 className="font-bold float-left">#{props.num}</h3>
                <Button
                    className="float-right"
                    size="small"
                    icon={<DeleteRegular />}
                    onClick={() => props.onDelete()}
                />
            </div>
            <Label htmlFor={inputTypeId}>{t("fields.type.title")}</Label>
            <Dropdown
                style={{ minWidth: 'auto' }}
                id={inputTypeId}
                defaultSelectedOptions={[props.trigger.type.toString().substring(0, 1).toUpperCase() + props.trigger.type.toString().substring(1).toLocaleLowerCase()]}
                defaultValue={type.toString().substring(0, 1).toUpperCase() + type.toString().substring(1).toLocaleLowerCase()}
                onOptionSelect={(_event: any, data: any) => {
                    const val = data.optionValue
                    let t: TriggerType
                    if (val === "Sunset") {
                        t = "SUNSET"
                    } else if (val === "Sunrise") {
                        t = "SUNRISE"
                    } else {
                        t = "TIME"
                    }

                    props.onSelectType(t)
                    setType(t)
                }}>
                <Option key={`${inputTypeId}_time`}>{t("fields.type.values.time")}</Option>
                <Option key={`${inputTypeId}_sunrise`}>{t("fields.type.values.sunrise")}</Option>
                <Option key={`${inputTypeId}_sunset`}>{t("fields.type.values.sunset")}</Option>
            </Dropdown>

            {props.trigger.type === "TIME" ?
                <>
                    <Label htmlFor={inputTimeId}>{t("fields.time")}</Label>
                    <Field id={inputTimeId}>
                        <Input
                            type="time"
                            value={time.value}
                            onChange={onChangeTime} />
                    </Field>
                </>
                : undefined}
            <Label htmlFor={inputDaysId}>{t("fields.days.title")}</Label>
            <Dropdown
                style={{ minWidth: 'auto' }}
                multiselect
                id={inputDaysId}
                defaultSelectedOptions={props.trigger.days.map((day: number) => days[day].label)}
                defaultValue={days.filter(d => props.trigger.days.indexOf(d.value) != -1).map(d => d.label).join(', ')}
                placeholder={t("fields.days.placeholder")}
                onOptionSelect={(_event: any, data: any) => {
                    const val = getDayFromValue(data.optionValue)?.value
                    if (val != undefined) {
                        props.onSelectDay(val)
                    }
                }}>
                {days.map(day => {
                    return <Option key={`${inputDaysId}_day_${day.value}`}>
                        {day.label}
                    </Option>
                })}
            </Dropdown>
        </div >
    )
}

function collectTriggers(button: IScene): ISceneTrigger[] {
    const triggers: Map<string, ISceneTrigger> = new Map()
    for (const trigger of button.triggers) {
        const tr: ISceneTrigger | undefined = triggers.get(trigger.id)
        const time: Date = convertDateToLocal(trigger.time)
        const day: number = time.getDay()

        if (tr == undefined) {
            triggers.set(trigger.id, { id: trigger.id, pushbutton_id: button.id, type: trigger.type, time: time, days: [day] })
        } else {
            if (tr.days.indexOf(day) === -1) {
                tr.days.push(day) // because of (x,y,z) key (action)
            }
        }
    }

    return Array.from(triggers.values())
}

function getDefaultDate() {
    const date: Date = new Date()
    date.setSeconds(0)
    date.setMinutes(0)
    return date
}

export const PushButtonScheduleModal = (props: { button: IScene, trigger: JSX.Element, }) => {
    const t = useTranslations('SceneScheduleModal');
    const [triggers, setTriggers] = React.useState<ISceneTrigger[]>(props.button.triggers.length == 0 ? [{ id: "null", pushbutton_id: props.button.id, type: "TIME", time: getDefaultDate(), days: [] }] : collectTriggers(props.button))

    function createTriggerComponent(trigger: ISceneTrigger, index: number) {
        if (!(trigger.time instanceof Date)) {
            trigger.time = convertDateToLocal(trigger.time)
        }

        return (
            <Trigger
                num={index + 1}
                key={`trigger_${index}`}
                trigger={trigger}
                onSelectDay={function (value: number): void {
                    const index: number = trigger.days.indexOf(value);
                    if (index === -1) {
                        trigger.days.push(value);
                    } else {
                        trigger.days.splice(index, 1);
                    }
                }}
                onChangeTime={((value: string) => {
                    const date: Date = new Date();
                    const d: string[] = value.split(":");
                    date.setHours(Number(d[0]));
                    date.setMinutes(Number(d[1]));
                    date.setSeconds(d.length > 2 ? Number(d[2]) : 0);

                    trigger.time = date;
                })}
                onDelete={function (): void {
                    const index = triggers.indexOf(trigger);
                    if (index != -1) {
                        const arr = [...triggers];
                        arr.splice(index, 1);
                        setTriggers(arr);
                    }
                }}
                onSelectType={function (type: TriggerType): void {
                    trigger.type = type
                }} />
        )
    }
    return (
        <InputModal
            {...props}
            title={t("title")}
            trigger={props.trigger}
            description={t("description")}
            handleSubmit={async function (): Promise<string | undefined> {
                const res = await fetch(`/api/videohubs/${props.button.videohub_id}/scenes/${props.button.id}/triggers`, getRequestHeader("PUT", { actions: props.button.actions, triggers: triggers }))
                if (res.status != 200) {
                    return Promise.resolve("Failed")
                }

                return Promise.resolve(undefined)
            }}>
            <div className="flex flex-col space-y-3">
                {triggers.map((trigger, index) => <div className="rounded-md border-2 border-gray-300 p-2 hover:bg-gray-50" key={`trigger_${index}`}>{createTriggerComponent(trigger, index)}</div>)}
                <Button
                    icon={<AddRegular />}
                    onClick={() => {
                        const arr = [...triggers]
                        arr.push({ id: "null", pushbutton_id: props.button.id, type: "TIME", time: getDefaultDate(), days: [] })
                        setTriggers(arr)
                    }}>
                    {t("add")}
                </Button>
            </div>
        </InputModal>
    )
}