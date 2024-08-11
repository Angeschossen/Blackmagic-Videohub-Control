import { Dropdown, Option } from "@fluentui/react-components";
import { TableCellLayout } from "@fluentui/react-components";
import DataTable, { DataTableColumn, DataTableItem } from "../DataTableNew";
import { getPostHeader } from "@/app/util/fetchutils";
import { IInput, IOutput, IRoutingUpdateCollection, IVideohub } from "@/app/interfaces/videohub";
import { hasRoleOutput, IUser } from "@/app/authentification/interfaces";


const columns: DataTableColumn[] = [
    {
        label: 'Output',
    },
    {
        label: 'Input'
    },
]

const columnsDefault = columns.slice()
columnsDefault.push({
    label: 'Default Input'
})

const getInputByLabel = (videohub: IVideohub, label: string): IInput => {
    for (const input of videohub.inputs) {
        if (input.label === label) {
            return input
        }
    }

    throw Error(`No input with label ${label} found.`)
}

export const OutputsView = (props: { videohub: IVideohub, outputs: IOutput[], user: IUser, selectInput?: boolean, onRoutingUpdate?: (routing: IRoutingUpdateCollection) => void }) => {
    function buildItems(): DataTableItem[] {
        const items: DataTableItem[] = []

        const videohub: IVideohub | undefined = props.videohub
        if (videohub != undefined) {
            const inputs = videohub.inputs.map(input =>
                <Option key={input.id.toString()} value={input.label}>
                    {input.label}
                </Option>)

            const inputsDefault = inputs.slice()
            inputsDefault.splice(0, 0,
                <Option key={"-1"} value={"None"}>
                    None
                </Option>)

            for (const output of props.outputs) {
                const key: number = output.id
                const canEditOutput: boolean = hasRoleOutput(props.user.role, videohub.id, output.id)
                const isEdit = props.selectInput && canEditOutput

                const cells: JSX.Element[] = [
                    <TableCellLayout key={`${key}_output`}>
                        {output.label}
                    </TableCellLayout>,
                    <TableCellLayout key={`${key}_input`}>
                        {isEdit ?
                            <Dropdown style={{ minWidth: 'auto' }} disabled={!canEditOutput}
                                defaultSelectedOptions={output.input_id != undefined ? [videohub.inputs[output.input_id].label] : undefined}
                                placeholder={output.input_id != undefined ? videohub.inputs[output.input_id].label : "None"}
                                onOptionSelect={async (_event: any, data: any) => {
                                    const found: IInput = getInputByLabel(videohub, data.optionValue);
                                    const routingUpdate: IRoutingUpdateCollection = { videohubId: videohub.id, outputs: [output.id], inputs: [found.id] };

                                    await fetch('/api/videohubs/updateRouting', getPostHeader(routingUpdate)).then(async res => {
                                        if (props.onRoutingUpdate != undefined) {
                                            const json = await res.json()
                                            routingUpdate.error = json.error == undefined ? undefined : `Routing update failed: ${json.error}`
                                            props.onRoutingUpdate(routingUpdate)
                                        }
                                    })
                                }}>
                                {inputs}
                            </Dropdown> :
                            output.input_id == undefined ? "Unkown" : videohub.inputs[output.input_id].label
                        }
                    </TableCellLayout>,
                ]

                if (props.selectInput) {
                    const selected = output.input_default_id == undefined ? "None" : videohub.inputs[output.input_default_id].label
                    cells.push(
                        <TableCellLayout style={{ padding: 1 }} key={`${key}_input_default`}>
                            {canEditOutput ?
                                <Dropdown style={{ minWidth: 'auto' }} disabled={!canEditOutput}
                                    defaultSelectedOptions={[selected]}
                                    placeholder={selected}
                                    onOptionSelect={async (_event: any, data: any) => {
                                        const found: IInput | undefined = getInputByLabel(videohub, data.optionValue);
                                        const routingUpdate: IRoutingUpdateCollection = { videohubId: videohub.id, outputs: [output.id], inputs: [found.id] }

                                        await fetch('/api/videohubs/setDefaultInput', getPostHeader(routingUpdate)).then(async res => {
                                            if (props.onRoutingUpdate != undefined) {
                                                const json = await res.json()
                                                routingUpdate.error = json.error == undefined ? undefined : `Default input update failed: ${json.error}`
                                                props.onRoutingUpdate(routingUpdate)
                                            }
                                        })
                                    }}>
                                    {inputsDefault}
                                </Dropdown> :
                                selected}
                        </TableCellLayout>
                    )
                }

                items.push({ key: key, cells: cells })
            }
        }

        return items
    }

    return (
        <DataTable
            items={buildItems()}
            columns={props.selectInput ? columnsDefault : columns} />
    )
}