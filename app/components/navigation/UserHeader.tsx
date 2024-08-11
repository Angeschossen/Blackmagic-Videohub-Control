"use client"

import { AlertMessage } from "../common/AlertMessage"
import { signOut } from "next-auth/react"
import { DoorArrowRightFilled } from '@fluentui/react-icons'
import { IUser } from "@/app/authentification/interfaces"

export const UserHeader = (props: { user: IUser }) => {
    return <AlertMessage
        message={`You're logged in as ${props.user.username}`}
        avatar={{ name: props.user.username, size: 24, color: "dark-red" }}
        action={
            {
                icon: <DoorArrowRightFilled />,
                onClick: () => {
                    signOut()
                }
            }
        }
        intent="info"
    />
}