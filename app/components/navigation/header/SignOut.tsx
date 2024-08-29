"use client"

import { signOut } from "next-auth/react";

export const SignOut = () => {
    return <p onClick={() => {
        signOut();
    }}>Sign out</p>;
}