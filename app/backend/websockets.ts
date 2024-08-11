import cache from 'global-cache';

export function emit(channel: string, data: any) {
    const socket: any = cache.get("socketio");
    if (socket == undefined) {
        return
    }

    socket.emit(channel, data);
    console.log(`Emitted data on channel ${channel}.`)
}
