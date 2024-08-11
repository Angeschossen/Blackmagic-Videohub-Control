"use client"

import { useEffect, useState } from "react";
import { io as ClientIO } from "socket.io-client"
import { useSocket } from "../providers/socket-provider";

const Test = () => {
    const { socket, isConnected } = useSocket();

    useEffect(() => {
        if (socket == null) {
            return;
        }

        socket.on("hello", () => {
            console.log(`Received message`);
        })

        console.log("Socket set")
    }, [socket])

    console.log("Render")
    return <></>
}

export default Test;