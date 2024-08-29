"use client"

import { signOut } from "next-auth/react";

export const SignOut = () => {
    return <p className="block px-4 py-2 hover:bg-gray-100" onClick={() => {
        signOut();
    }}>Sign out</p>;
}