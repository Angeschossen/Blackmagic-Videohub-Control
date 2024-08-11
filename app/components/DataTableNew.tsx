import { Table, TableBody, TableCell, TableCellLayout, TableHeader, TableHeaderCell, TableRow } from '@fluentui/react-components';

export interface TableInput {
    items: DataTableItem[] | undefined,
    columns: DataTableColumn[],
}

export interface DataTableColumn {
    key?: string,
    label: string,
}

export interface DataTableItem {
    key: string | number,
    cells: JSX.Element[],
}

interface TableData {
    items?: DataTableItem[],
}

export interface DataItem {
    key: string | number,
}

export function buildDataTableItems(items: DataItem[]): DataTableItem[] {
    const data: DataTableItem[] = [];

    for (const item of items) {
        const cells: JSX.Element[] = []

        for (const [k, v] of Object.entries(item)) {
            if (k != "key") {
                cells.push(
                    <TableCell>
                        <TableCellLayout>{v}</TableCellLayout>
                    </TableCell>
                );
            }
        }

        data.push({ key: item.key, cells: cells })
    }

    return data;
}


export const DataTable = (props: TableInput) => {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    {props.columns.map(column => <TableHeaderCell key={column.key || column.label.toLowerCase()}>{column.label}</TableHeaderCell>)}
                </TableRow>
            </TableHeader>
            <TableBody>
                {props.items?.map(item =>
                    <TableRow key={item.key}>
                        {item.cells.map(cell =>
                            <TableCell key={cell.key}>
                                {cell}
                            </TableCell>
                        )}
                    </TableRow>)}
            </TableBody>
        </Table>
    );
}

export default DataTable;
