import { Stack } from "@fluentui/react";
import { Button, Dialog, DialogActions, DialogBody, DialogContent, DialogOpenChangeData, DialogOpenChangeEvent, DialogSurface, DialogTitle, DialogTrigger, makeStyles } from "@fluentui/react-components";
import React from "react";
import { AlertMessage } from "../common/AlertMessage";
import { stackTokens } from "@/app/util/styles";


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

const useStyles = makeStyles({
    content: {
        display: 'flex',
        flexDirection: 'column',
        rowGap: '10px',
    }
});

export const InputModal = (props: InputProps) => {
    const [error, setError] = React.useState<string | undefined>();
    const [open, setOpen] = React.useState<boolean>(props.open || false)

    const styles = useStyles();
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
                        <DialogContent className={styles.content}>
                            <Stack horizontalAlign="center" style={{ marginBottom: 8 }}>
                                {props.description}
                                <Stack tokens={stackTokens}>
                                    {props.children}
                                    {error != undefined &&
                                        <Stack.Item>
                                            <AlertMessage
                                                style={{ margin: 5 }}
                                                intent="error"
                                                message={error} />
                                        </Stack.Item>}
                                </Stack>
                            </Stack>
                        </DialogContent>
                        <DialogActions>
                            <DialogTrigger>
                                <Button appearance="secondary">Close</Button>
                            </DialogTrigger>
                            {props.additionalTrigger}
                            <Button type="submit" appearance="primary">
                                Submit
                            </Button>
                        </DialogActions>
                    </DialogBody>
                </form>
            </DialogSurface>
        </Dialog>
    );

    /*
    return (
        <Modal
            isOpen={props.isOpen}
            key={props.modalKey}>
            <Stack tokens={stackTokens} styles={{ root: { padding: '2vh' } }}>
                {props.children}
                {data.error != undefined &&
                    <BarMessage text={data.error} type={MessageBarType.error}></BarMessage>
                }
                <Confirmation
                    onCancel={() => {
                        close();
                        props.onCancel();
                    }}
                    onConfirm={() => {
                        const err: string | undefined = props.onConfirm();
                        if (err == undefined) {
                            close();
                        } else {
                            setData({ error: err });
                        }
                    }} />
            </Stack>
        </Modal>
    ); */
}