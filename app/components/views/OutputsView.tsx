import { Dropdown, Option } from "@fluentui/react-components";
import { TableCellLayout } from "@fluentui/react-components";
import DataTable, { DataTableColumn, DataTableItem } from "../DataTableNew";
import { getRequestHeader } from "@/app/util/fetchutils";
import { IInput, IOutput, IRoutingUpdateCollection, IVideohub, RoutingUpdateResult } from "@/app/interfaces/videohub";
import { hasRoleOutput, IUser } from "@/app/authentification/interfaces";
import { useTranslations } from "next-intl";


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
    const t = useTranslations('RoutingTable');

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
                <Option key={"-1"} value={t("none")}>
                    {t("none")}
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
                                placeholder={output.input_id != undefined ? videohub.inputs[output.input_id].label : t("none")}
                                onOptionSelect={async (_event: any, data: any) => {
                                    const found: IInput = getInputByLabel(videohub, data.optionValue);
                                    const routingUpdate: IRoutingUpdateCollection = { videohubId: videohub.id, outputs: [output.id], inputs: [found.id] };

                                    await fetch(`/api/videohubs/${videohub.id}/routing`, getRequestHeader("POST", routingUpdate)).then(async res => {
                                        if (props.onRoutingUpdate != undefined) {
                                            const json = await res.json() as RoutingUpdateResult;
                                            routingUpdate.error = json.result ? undefined : json.message
                                            props.onRoutingUpdate(routingUpdate);
                                        }
                                    })
                                }}>
                                {inputs}
                            </Dropdown> :
                            output.input_id == undefined ? t("unknown") : videohub.inputs[output.input_id].label
                        }
                    </TableCellLayout>,
                ]

                if (props.selectInput) {
                    const selected = output.input_default_id == undefined ? t("none") : videohub.inputs[output.input_default_id].label
                    cells.push(
                        <TableCellLayout style={{ padding: 1 }} key={`${key}_input_default`}>
                            {canEditOutput ?
                                <Dropdown style={{ minWidth: 'auto' }} disabled={!canEditOutput}
                                    defaultSelectedOptions={[selected]}
                                    placeholder={selected}
                                    onOptionSelect={async (_event: any, data: any) => {
                                        const found: IInput | undefined = data.optionValue === t("none") ? undefined : getInputByLabel(videohub, data.optionValue);
                                        const routingUpdate: IRoutingUpdateCollection = { videohubId: videohub.id, outputs: [output.id], inputs: [found == undefined ? -1 : found.id] }

                                        await fetch(`/api/videohubs/${videohub.id}/default-input`, getRequestHeader("PUT", routingUpdate)).then(async res => {
                                            if (props.onRoutingUpdate != undefined) {
                                                if (res.status == 200) {
                                                    const json = await res.json()
                                                    routingUpdate.error = json.error == undefined ? undefined : `Default input update failed: ${json.error}`
                                                } else {
                                                    routingUpdate.error = "Request failed.";
                                                }

                                                props.onRoutingUpdate(routingUpdate);
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
            columns={props.selectInput ? [
                { label: t("columns.output") },
                { label: t("columns.input") },
                { label: t("columns.defaultInput") }
            ] : [
                { label: t("columns.output") },
                { label: t("columns.input") },
            ]} />
    )
}