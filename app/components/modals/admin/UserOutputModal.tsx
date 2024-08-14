import { Button } from "@fluentui/react-components";
import { CheckBoxModal } from "./CheckBoxModal";
import { getRequestHeader } from "@/app/util/fetchutils";
import { IVideohub } from "@/app/interfaces/videohub";
import { IRole } from "@/app/authentification/interfaces";


interface Props {
    role: IRole,
    videohub: IVideohub,
}

export const UserOutput = (props: Props) => {

    return (
        <CheckBoxModal
            title={"Outputs"}
            trigger={<Button>
                Outputs
            </Button>}
            handleSubmit={async function (checked: string[]): Promise<string | undefined> {
                return fetch(`/api/roles/${props.role.id}/outputs`, getRequestHeader("PUT",{ videohub_id: props.videohub.id, outputs: checked })).then(res => {
                    return undefined;
                });
            }}
            defaultChecked={props.role.outputs.filter(output => output.videohub_id === props.videohub.id).map(output => output.output_id.toString())}
            choices={props.videohub.outputs.map(output => {
                return { value: output.id.toString(), label: output.label };
            })} />
    )
}