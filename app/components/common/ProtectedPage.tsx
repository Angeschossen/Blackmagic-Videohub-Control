import { DefaultButton, Stack } from "@fluentui/react";
import { Button, Tooltip } from "@fluentui/react-components";
import { DoorArrowRightFilled } from "@fluentui/react-icons";
import { signOut, useSession } from "next-auth/react";
import React from "react";

interface InputProps {
    children: React.ReactNode,
}

export function useProtectedSession() {

}
export const ProtectedPage = (props: InputProps) => {
    // if `{ required: true }` is supplied, `status` can only be "loading" or "authenticated"
    const { data: session, status } = useSession({ required: true });

    if (status === "loading") {
        return <></>
    }

    const sess: any = session;
    if (sess.user.role?.permissions == undefined) {
        return (<Stack style={{ display: 'flex', textAlign: 'center', justifyContent: "center", alignItems: "center", minHeight: '100vh' }}>
            <h1>You haven&apos;t been assigned a role yet.</h1>
            <Button
                icon={<DoorArrowRightFilled />}
                iconPosition="after"
                onClick={() => signOut()}
            >Logout and try again.</Button>
        </Stack>)
    }

    return <>{props.children}</>;
}