"use client"

import { signOut } from "next-auth/react"
import { IUser } from "@/app/authentification/interfaces"

export const UserHeader = (props: { user: IUser }) => {
    return <div className="flex justify-between items-center space-x-1 p-2 rounded-md border shadow-md">
        <p className="font-bold">{`Welcome, ${props.user.username}.`}</p>
        <div className="group relative">
            <div className="inline-flex items-center justify-center w-10 h-10 overflow-hidden bg-gray-300 rounded-full">
                <span className="font-medium text-black">{props.user.username.substring(0, 1)}</span>
            </div>
            <div className="group-hover:opacity-100 mt-1 opacity-0 absolute w-max right-0 text-base bg-white border shadow-md divide-y divide-gray-200 rounded-md">
                <div className="px-4 py-3 text-sm text-black">
                    <p>{`User: ${props.user.username}`}</p>
                    <p>{`Role: ${props.user.role?.name}`}</p>
                </div>
                <ul className="py-1 text-sm text-gray-700" aria-labelledby="avatarButton">
                    <li>
                        <p className="block px-4 py-2 hover:bg-gray-100" onClick={() => {
                            signOut();
                        }}>Sign out</p>
                    </li>
                </ul>
            </div>
        </div>
    </div>;
}