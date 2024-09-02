import { Button, Dialog, DialogActions, DialogBody, DialogContent, DialogOpenChangeData, DialogOpenChangeEvent, DialogSurface, DialogTitle, DialogTrigger, makeStyles } from "@fluentui/react-components";
import React from "react";
import { AlertMessage } from "../common/AlertMessage";
import { useTranslations } from "next-intl";


interface InputProps extends InputModalProps {
}

export interface InputModalProps {
    trigger?: JSX.Element,
    title: string,
    children?: React.ReactNode,
    open?: boolean,
    onOpenChange?: (open: boolean) => void,
    handleSubmit: () => Promise<string | undefined>,
    description?: string,
    additionalTrigger?: JSX.Element,
}

export const InputModal = (props: InputProps) => {
    const [error, setError] = React.useState<string | undefined>();
    const [open, setOpen] = React.useState<boolean>(props.open || false)
    const t = useTranslations('InputModal');

    const handleSubmit = (ev: React.FormEvent) => {
        ev.preventDefault();

        props.handleSubmit().then(err => {
            setError(err);

            if (err == undefined) {
                setOpen(false);
            }
        });
    };

    return (
        <Dialog
            open={open}
            onOpenChange={(_event: DialogOpenChangeEvent, data: DialogOpenChangeData) => {
                if (props.onOpenChange != undefined) {
                    props.onOpenChange(data.open);
                }

                setOpen(data.open)
            }}
            modalType="non-modal">
            <>
                {props.trigger != undefined &&
                    <DialogTrigger>
                        {props.trigger}
                    </DialogTrigger>}
            </>
            <DialogSurface>
                <form onSubmit={handleSubmit}>
                    <DialogBody>
                        <DialogTitle>{props.title}</DialogTitle>
                        <DialogContent>
                            {props.description}
                            <div className="flex flex-col items-center my-4 space-y-3">
                                {props.children}
                                {error != undefined &&
                                    <AlertMessage
                                        style={{ margin: 5 }}
                                        intent="error"
                                        message={error} />
                                }
                            </div>
                        </DialogContent>
                        <DialogActions>
                            <DialogTrigger>
                                <Button appearance="secondary">{t("buttons.close")}</Button>
                            </DialogTrigger>
                            {props.additionalTrigger}
                            <Button type="submit" appearance="primary">{t("buttons.submit")}</Button>
                        </DialogActions>
                    </DialogBody>
                </form>
            </DialogSurface>
        </Dialog>
    );
}