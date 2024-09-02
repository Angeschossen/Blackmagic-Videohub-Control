import { Input, InputProps, Label } from "@fluentui/react-components";
import { Field, FieldProps } from "@fluentui/react-components";
import React from "react";


export interface InputState {
    value: any,
    validation?: {
        state: "success" | "error",
        message: string,
    }
}

export const HandledInputField = (props: { id: string, value: string, onChangeInput: (value: string) => string | undefined } & FieldProps) => {
    const [data, setData] = React.useState<{ error?: string, value: string }>({ error: undefined, value: props.value })

    const onChangeInput: InputProps['onChange'] = (_ev, data) => {
        setData({ error: props.onChangeInput(data.value), value: data.value })
    }

    return (
        <div>
            <Label htmlFor={props.id}>Name</Label>
            <Field
                id={props.id}
                validationState={data.error == undefined ? "success" : "error"}
                validationMessage={data.error == undefined ? data.value.trim().length != 0 ? "The name is valid." : undefined : data.error}>
                <Input
                    value={data.value}
                    onChange={onChangeInput} />

            </Field>
        </div>
    )
}