import { IconButton, Stack } from '@fluentui/react';

export interface ConfirmationProps {
    onCancel: () => void,
    onConfirm: () => void,
};

export const Confirmation = (p: ConfirmationProps) => {
    return (
        <Stack verticalAlign='end' horizontal styles={{ root: { justifyContent: 'space-between' } }}>
            <IconButton
                key='cancel'
                iconProps={{ iconName: 'Cancel' }}
                text='Cancel'
                onClick={p.onCancel} />
            <IconButton
                key='done'
                iconProps={{ iconName: 'Accept' }}
                text='Done'
                onClick={p.onConfirm} />
        </Stack>
    );
}