import { Checkbox, CheckboxOnChangeData } from "@fluentui/react-components";
import React, { ChangeEvent } from "react";
import { InputModal } from "../InputModalNew";


export interface CheckboxChoice {
    value: string,
    label: string
}

interface Props {
    defaultChecked: string[],
    choices: CheckboxChoice[],
    handleSubmit: (checked: string[]) => Promise<string | undefined>,
    title: string,
    trigger: JSX.Element,
    description?: string,
}

export const CheckBoxModal = (props: Props) => {
    const [checkedValues, setCheckedValues] = React.useState<string[]>(props.defaultChecked);

    const handleSelected = (id: string) => {
        setCheckedValues(prev => [...prev, id]);
    }

    const handleUnSelected = (index: number) => {
        if (index != -1) {
            const arr = [...checkedValues]
            arr.splice(index, 1)
            setCheckedValues(arr)
        }
    }

    return (
        <InputModal
            description={props.description}
            title={props.title}
            trigger={props.trigger}
            handleSubmit={async function (): Promise<string | undefined> {
                return props.handleSubmit(checkedValues);
            }}>
            <div className="flex flex-col">
                {props.choices.map(choice =>
                    <Checkbox key={`checkbox_${choice.value}`} checked={checkedValues.indexOf(choice.value) != -1} label={choice.label} onChange={(_ev: ChangeEvent<HTMLInputElement>, data: CheckboxOnChangeData) => {
                        if (data.checked) {
                            handleSelected(choice.value)
                        } else {
                            handleUnSelected(checkedValues.indexOf(choice.value))
                        }
                    }} />)}
            </div>
        </InputModal>
    )
}