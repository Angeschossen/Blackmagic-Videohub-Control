"use client"

import { Button } from "@fluentui/react-components";
import { DoorArrowRightFilled } from "@fluentui/react-icons";
import { signOut, useSession } from "next-auth/react";
import React from "react";
import { Loading } from "../components/common/LoadingScreen";

export const ProtectedPage = ({ children }: { children: React.ReactNode }) => {
    /*
     if required = true is supplied, status can only be "loading" or "authenticated". 
     User will be automatically redirected to login if session is invalid.
     */
    const { data: session, status } = useSession({ required: true });

    if (status === "loading") {
        return <Loading />;
    }

    const sess: any = session;
    if (sess.user.role?.permissions == undefined) { // user doesn't have a role yet
        return (
            <div className="flex items-center justify-center h-screen">
                <h1>You haven&apos;t been assigned a role yet.</h1>
                <Button
                    icon={<DoorArrowRightFilled />}
                    iconPosition="after"
                    onClick={() => signOut()}
                >Logout and try again.</Button>
            </div>
        );
    }

    return <>{children}</>;
}