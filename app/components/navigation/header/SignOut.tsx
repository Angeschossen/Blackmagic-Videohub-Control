"use client"

import { signOut } from "next-auth/react";
import { useTranslations } from "next-intl";

export const SignOut = () => {
    const t = useTranslations('Header');

    return <p onClick={() => {
        signOut();
    }}>{t("user.signOut")}</p>;
}