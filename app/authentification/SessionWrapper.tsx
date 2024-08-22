// mark as client component
"use client";
import { SessionProvider } from "next-auth/react"

import React from 'react'
import { ProtectedPage } from "../providers/session-provider";

const SessionHandler = ({ children }: { children: React.ReactNode }) => {
    return (
        <SessionProvider>
            <ProtectedPage>
                {children}
            </ProtectedPage>
        </SessionProvider>
    )
}

export default SessionHandler;