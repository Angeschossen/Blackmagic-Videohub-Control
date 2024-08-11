import { Button, Checkbox, CheckboxOnChangeData } from "@fluentui/react-components";
import React, { ChangeEvent } from "react";
import { InputModal } from "../InputModalNew";
import { useInputStyles } from "@/app/util/styles";
import { getPostHeader } from "@/app/util/fetchutils";
import { IRole } from "@/app/authentification/interfaces";
import { IVideohub } from "@/app/interfaces/videohub";


interface Props {
    role: IRole,
    videohub: IVideohub
}
export const UserOutput = (props: Props) => {
    const [checkedValues, setCheckedValues] = React.useState(props.role.outputs.filter(output => output.videohub_id === props.videohub.id).map(output => output.output_id));
    const styles = useInputStyles();

    const handleSelected = (id: number) => {
        setCheckedValues(prev => [...prev, id]);
    };

    const handleUnSelected = (index: number) => {
        if (index != -1) {
            setCheckedValues([
                ...checkedValues.slice(0, index),
                ...checkedValues.slice(index + 1, checkedValues.length)
            ]);
        }
    }

    return (
        <InputModal
            title={"Outputs"}
            trigger={<Button>
                Outputs
            </Button>}
            handleSubmit={async function (): Promise<string | undefined> {
                return fetch('/api/roles/setoutputs', getPostHeader({ videohub_id: props.videohub.id, role_id: props.role.id, outputs: checkedValues })).then(res => {
                    return undefined;
                })
            }}>
            <div className={styles.root}>
                {props.videohub.outputs.map(output =>
                    <Checkbox key={`checkbox_${output.id}`} checked={checkedValues.indexOf(output.id) != -1} label={output.label} onChange={(_ev: ChangeEvent<HTMLInputElement>, data: CheckboxOnChangeData) => {
                        if (data.checked) {
                            handleSelected(output.id)
                        } else {
                            handleUnSelected(checkedValues.indexOf(output.id))
                        }
                    }} />)}
            </div>
        </InputModal>
    )
}