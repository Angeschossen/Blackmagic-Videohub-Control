"use client"

import {
    createContext,
    useContext,
    useEffect,
    useRef,
    useState
} from "react"
import { io as ClientIO } from "socket.io-client"

type SocketContextType = {
    socket: any | null,
    isConnected: boolean
}

const SocketContext = createContext<SocketContextType>({
    socket: null,
    isConnected: false
});

export const useSocket = () => {
    return useContext(SocketContext);
}

export const SocketProvider = ({ children }: {
    children: React.ReactNode
}) => {
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        const socketInstance = new (ClientIO as any)(process.env.NEXT_PUBLIC_SITE_URL!, {
            path: "/api/socket/io",
            addTrailingSlash: false,
        });

        function onConnect() {
            console.log("Socket connected")
            setIsConnected(true);
        }

        function onDisconnect() {
            console.log("Socket disconnected")
            setIsConnected(false);
        }

        socketInstance.on("connect", onConnect);
        socketInstance.on("disconnect", onDisconnect);
        setSocket(socketInstance);

        return () => {
            socketInstance.off("connect", onConnect);
            socketInstance.off("disconnect", onDisconnect);
            socketInstance.disconnect();
        }
    }, [])

    return (
        <SocketContext.Provider value={{ socket, isConnected }}>
            {children}
        </SocketContext.Provider>
    )
}