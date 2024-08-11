import { handleCheckPermission } from "@/app/authentification/server-auth";
import { NextApiResponseServerIo } from "@/types";
import { NextApiRequest, NextApiResponse } from "next";
import { getToken } from "next-auth/jwt";
import { Server as NetServer } from "http";
import { Server as ServerIO } from "socket.io"
import cache from 'global-cache';

function sendResponseInvalidLegacy(req: NextApiRequest, res: NextApiResponse, msg: string) {
    res.status(405).json({ message: 'Invalid request.', error: 'Invalid request' });
    console.log("Invalid request: " + msg + " Request: " + req)
}

async function checkServerPermissionLegacy(req: NextApiRequest, res: NextApiResponse, permission?: string) {
    const token = await getToken({ req: req });
    if (!handleCheckPermission(token, permission ? [permission] : undefined)) {
        sendResponseInvalidLegacy(req, res, "Unauthorized.")
        return false;
    }

    return true;
}

export const config = {
    api: {
        bodyParser: false,
    }
}

const ioHandler = async (req: NextApiRequest, res: NextApiResponseServerIo) => {
    if (!await checkServerPermissionLegacy(req, res)) {
        return
    }

    if (!res.socket.server.io) {
        const path = "/api/socket/io";
        const httpServer: NetServer = res.socket.server as any;
        const io = new ServerIO(httpServer, {
            path: path,
            addTrailingSlash: false,
        });

        cache.set("socketio", io)
        res.socket.server.io = io;

        io.on('connect', () => {
            console.log(`User connected to websocket.`)
        });

        io.on('disconnect', () => {
            console.log(`User disconnected from websocket.`)
        });

        /*
        setInterval(() => {
            io.emit("hello", { test: "Test 123" });
        }, 1000, 1000);
        */
    }

    res.end();
}

export default ioHandler;