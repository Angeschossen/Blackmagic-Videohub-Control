import { Button } from "@fluentui/react-components";
import { TableCellLayout } from "@fluentui/react-components";
import { CalendarEditRegular, EditRegular } from "@fluentui/react-icons";
import DataTable, { DataTableItem } from "../../DataTableNew";
import { EditPushButtonModal } from "../../modals/pushbuttons/EditPushButtonModalNew";
import { PushButtonScheduleModal } from "../../modals/pushbuttons/PushButtonScheduleModal";
import { sortButtons } from "./PushButtonsView";
import { useClientSession } from "@/app/authentification/client-auth";
import { PERMISSION_VIDEOHUB_SCENES_SCHEDULE } from "@/app/authentification/permissions";
import { IVideohub } from "@/app/interfaces/videohub";
import { IScene } from "@/app/interfaces/scenes";
import { IUser } from "@/app/authentification/interfaces";
import { useTranslations } from "next-intl";

export const PushButtonsTableView = (props: { videohub: IVideohub, buttons: IScene[], onButtonUpdate: (button: IScene, action: "create" | "update" | "delete") => void, user: IUser }) => {
    const canSchedule: boolean = useClientSession(PERMISSION_VIDEOHUB_SCENES_SCHEDULE)
    const t = useTranslations('ScenesTable');

    function buildItems(): DataTableItem[] {
        const items: DataTableItem[] = []

        for (const button of props.buttons.sort(sortButtons)) {
            const key: number = button.id
            const cells: JSX.Element[] = [
                <TableCellLayout key={`${key}_name`}>
                    {button.label}
                </TableCellLayout>,
                <TableCellLayout key={`${key}_description`}>
                    {button.description || t("defaultDescription", {amount: button.actions.length})}
                </TableCellLayout>,
                <TableCellLayout key={`${key}_edit`}>
                    <div className="md:flex justify-items-center">
                        <div className="mr-2 my-2">
                            <EditPushButtonModal
                                user={props.user}
                                onButtonUpdate={props.onButtonUpdate}
                                videohub={props.videohub}
                                buttons={props.buttons}
                                button={button}
                                trigger={
                                    <Button icon={<EditRegular />}>
                                        {t("actions.edit")}
                                    </Button>
                                }
                            />
                        </div>
                        <div className="my-2">
                            <PushButtonScheduleModal
                                button={button}
                                trigger={
                                    <Button
                                        icon={<CalendarEditRegular />}
                                        disabled={!canSchedule}>
                                        {t("actions.schedule")}
                                    </Button>
                                } />
                        </div>
                    </div>
                </TableCellLayout>,
            ]

            items.push({ key: key, cells: cells })
        }

        return items
    }

    return (
        <DataTable
            items={buildItems()}
            columns={[
                {
                    label: t("columns.name")
                },
                {
                    label: t("columns.description")
                },
                {
                    label: t("columns.actions")
                },
            ]}
        />
    )
}