import net from 'net';
const CronJob = require('cron').CronJob;
import cache from 'global-cache';
import { getPrisma } from './prismadb';
import { TTLCacheService } from '../util/TTLCache';
import { Button, getLabelOfButton, retrievescheduledButton, retrieveScheduledButtonsToday, updateSunriseSet } from './scenes';
import { emit } from './websockets';
import { IUpcomingScene } from '../interfaces/scenes';
import { IOutput, IVideohub, RoutingUpdateResult } from '../interfaces/videohub';

/* Icons */
export const ICON_ERROR: string = "Error"
export const ICON_SUCCESS: string = "Accept"
const ICON_CONNECTION_SUCCESS: string = "NetworkTower";

/* Videohub */
const VIDEOHUB_PORT: number = 9990;
const CONNECTION_HEALT_CHECK_INTERVAL: number = 60000;
const REQUEST_TIMEOUT: number = 5000;
const REQUEST_RECONNECT_GRACE_TIME: number = 2000;

/* Reconnect */
const CLIENT_RECONNECT_INTERVAL_LOWEST: number = 5 * 1000; // 5 seconds
const CLIENT_RECONNECT_ATTEMPTS_LOWEST: number = 6;
const CLIENT_RECONNECT_INTERVAL_LOW: number = 2 * 60 * 1000; // 2 minutes
const CLIENT_RECONNECT_ATTEMPTS_LOW: number = 11;
const CLIENT_RECONNECT_INTERVAL_NORMAL: number = 4 * 60 * 1000; // 4 minutes

/* Protocol */
const PROTOCOL_CONFIGURATION: string = "CONFIGURATION:"
const PROTOCOL_END_PRELUDE: string = "END PRELUDE:"
const PROTOCOL_VIDEO_OUTPUT_LOCKS: string = "VIDEO OUTPUT LOCKS:"
const PROTOCOL_INPUT_LABELS: string = "INPUT LABELS:"
const PROTOCOL_PREAMPLE: string = "PROTOCOL PREAMBLE:"
const PROTOCOL_ACKNOWLEDGED: string = "ACK";
const PROTOCOL_VIDEOHUB_DEVICE: string = "VIDEOHUB DEVICE:"
const PROTOCOL_OUTPUT_LABELS: string = "OUTPUT LABELS:"
const PROTOCOL_VIDEO_OUTPUT_ROUTING: string = "VIDEO OUTPUT ROUTING:"

function getLines(input: string): string[] {
    const lines = input.split("\n");

    // thrim those lines
    for (let i = 0; i < lines.length; i++) {
        lines[i] = lines[i].trim();
    }

    return lines;
}

function getConfigEntry(lines: string[], index: number): string {
    if (index >= lines.length) {
        throw new Error(`Index out of bounds: ${lines}, index: ${index}`)
    }

    const line = lines[index];
    return line.substring(line.indexOf(":") + 1).trim();
}

function getCorrespondingLines(lines: string[], index: number) {
    const arr = [];
    for (let i = index + 1; i < lines.length; i++) {
        const line = lines[i];
        if (line === "") {
            break; // end
        }

        arr.push(line);
    }

    return arr;
}

function checkConnection(host: string, port: number, timeout: number) {
    return new Promise(function (resolve, reject) {
        timeout = timeout || 10000; // default of 10 seconds
        const timer = setTimeout(function () {
            reject("timeout");
            socket.end();
        }, timeout);

        const socket = net.createConnection(port, host, function () {
            clearTimeout(timer);
            resolve(undefined);
            socket.end();
        });

        socket.on('error', function (err: Error) {
            clearTimeout(timer);
            reject(err);
        });
    });
}

class InputChangeRequest {
    outputs: number[];
    inputs: number[];
    ackList: Array<string>;
    onSuccess: () => void;
    result?: RoutingUpdateResult;

    constructor(outputs: number[], inputs: number[], onSuccess: () => void) {
        this.outputs = outputs;
        this.inputs = inputs;
        this.onSuccess = onSuccess;
        this.ackList = new Array(outputs.length);
    }

    send(videohub: Videohub) {
        let send = `${PROTOCOL_VIDEO_OUTPUT_ROUTING}`
        for (let i = 0; i < this.outputs.length; i++) {
            send += `\n${this.outputs[i]} ${this.inputs[i]}`;
        }

        send += '\n\n';

        videohub.info(`Sending routing update: ${send}`);
        videohub.client.write(send);
        videohub.addRequest(this)
        videohub.info("Routing update sent.");
    }
}

class Output {
    videohub: Videohub;
    id: number;
    input_id: number | null;

    constructor(videohub: Videohub, id: number) {
        this.id = id;
        this.input_id = null
        this.videohub = videohub
    }

    updateRouting(input_id: number) {
        this.videohub.info(`Updating routing: ${this.id} ${input_id}`);
        this.input_id = input_id;
    }

    async save(label: string) {
        const vid = Number(this.videohub.data.id);
        const input_id = this.input_id == undefined ? null : this.input_id;
        await getPrisma().output.upsert({
            where: {
                videohub_output: {
                    videohub_id: vid,
                    id: this.id, // prisma requires id to start at 1
                }
            },
            update: {
                input_id: input_id,
                label: label,
            },
            create: {
                id: this.id,
                videohub_id: vid,
                input_id: input_id,
                label: label,
            }
        })
    }
}

export class Videohub {
    data: IVideohub;
    client: any | undefined;
    connecting: NodeJS.Timeout | undefined;
    requestQueque: InputChangeRequest[] = [];
    outputsObjs: Array<Output> = new Array(0);
    connectionAttempt: number = 0;
    checkConnectionHealthId: NodeJS.Timeout | undefined;
    scheduledButtons: Button[] = [];
    failedButtonsCache: TTLCacheService = new TTLCacheService({ max: 100, ttl: 1000 * 60 * 10 }); // keep them 10 minutes until they expire
    socket: any;

    constructor(data: IVideohub) {
        this.data = data;
        this.data.connected = false;
        this.data.lastRoutingUpdate = new Date();
    }

    getData(): IVideohub {
        return this.data;
    }

    getId(): number {
        return this.data.id;
    }

    removeScheduledButton(buttonId: number) {
        this.info(`Removing scheduled button: ${buttonId}`);
        this.scheduledButtons = this.scheduledButtons.filter(b => {
            if (b.id === buttonId) {
                b.stopSchedule();
                return false;
            }

            return true;
        })

        this.emitScheduleChange();
    }

    addFailedButton(button: Button) {
        this.info(`Adding failed button ${button.id}.`);
        button.stopSchedule(); // make sure it's always stopped, fallback
        this.failedButtonsCache.set(button.id, button);
    }

    async executeButton(buttonId: number): Promise<RoutingUpdateResult> {
        this.info(`Executing button ${buttonId}.`);

        const actions = await getPrisma().sceneAction.findMany({
            where: {
                scene_id: buttonId,
            },
            select: {
                output_id: true,
                input_id: true,
            }
        });

        if (actions.length === 0) {
            this.info("Button doesn't exist any longer.");
            return Promise.resolve({ result: false, message: "Button doesn't exist any longer." });
        }

        const outputs = []
        const inputs = []
        for (const action of actions) {
            outputs.push(action.output_id);
            inputs.push(action.input_id);
        }

        return this.sendRoutingUpdateRequest(outputs, inputs);
    }

    async retryFailedButtons() {
        this.info("Retrying scheduled buttons.")
        for (const failed of this.failedButtonsCache.getValues()) {
            await this.executeButton(failed.id).then(async result => {
                const label = await getLabelOfButton(failed.id)

                if (result != undefined) {
                    await this.logActivity(`Rescheduled scene failed: ${label}`, ICON_ERROR)
                    // dont remove. They will be removed when ttl expires
                } else {
                    await this.logActivity(`Rescheduled scene applied successfully: ${label}`, ICON_SUCCESS)
                    this.failedButtonsCache.delete(failed.id) // only remove if success
                }
            });
        }
    }

    async scheduleButtons() {
        this.info(`[${new Date().toLocaleString()}] Scheduling buttons...`)
        this.stopScheduledButtons()
        this.scheduledButtons = await retrieveScheduledButtonsToday(this)

        for (const button of this.scheduledButtons) {
            await button.handleScheduleNextTrigger(new Date())
        }

        this.emitScheduleChange()
        this.info(`Buttons scheduled: ${this.scheduledButtons.length}`)
    }

    emitScheduleChange = () => {
        emit(`videohubUpdate_scheduled`, this.getScheduledButtons())
    }

    cancelScheduledButton(scene: Button, cancel: boolean) {
        scene.cancel(cancel)
        this.emitScheduleChange()
    }

    getScheduledButton(buttonId: number) {
        for (const button of this.scheduledButtons) {
            if (button.id === buttonId) {
                return button
            }
        }
    }

    async handleButtonReSchedule(buttonId: number) {
        await updateSunriseSet(this) // because if button is other type

        let res = false;
        for (const button of this.scheduledButtons) {
            if (button.id === buttonId) {
                await button.handleScheduleNextTrigger(new Date())
                res = true
                break
            }
        }

        if (!res) {
            // not in arr yet
            const button = await retrievescheduledButton(this, buttonId, new Date())
            if (button != undefined) {
                this.scheduledButtons.push(button)
                this.onScheduledTimeChanged()
                if (await button.handleScheduleNextTrigger(new Date())) {
                    res = true
                }
            }
        }

        if (res) {
            this.emitScheduleChange()
        }
    }

    onScheduledTimeChanged() {
        this.scheduledButtons = this.scheduledButtons.sort((a, b) => a.time.getTime() - b.time.getTime())
    }

    sendRoutingUpdateRequest(outputs: number[], inputs: number[]): Promise<RoutingUpdateResult> {
        this.info(`Trying to send routing update: ${outputs} - ${inputs}`)

        if (outputs.length == 0 || outputs.length != inputs.length) {
            this.info("Request was empty or length mismatch.")
            return Promise.resolve<RoutingUpdateResult>({ result: false, message: "Invalid parameters." })
        }

        return new Promise<RoutingUpdateResult>((resolve, reject) => {
            const request: InputChangeRequest = new InputChangeRequest(outputs, inputs, () => {
                this.info(`Request was successful: ${outputs} ${inputs}`);

                request.result = { result: true };
                this.removeRequest(request);
                resolve(request.result);
            })

            // register and send
            let timeoutTime: number;
            let timeout2Id: NodeJS.Timeout;
            if (!this.data.connected) { // wait for reconnect and then send it
                timeoutTime = REQUEST_RECONNECT_GRACE_TIME;

                setTimeout(() => {
                    if (this.data.connected) {
                        request.send(this); // send it
                    } else {
                        request.result = { result: false, message: "No connection to videohub." }; // still not connected
                        resolve(request.result);
                        clearTimeout(timeout2Id); // we dont need to wait for the second timeout, cancel it...
                    }
                }, REQUEST_RECONNECT_GRACE_TIME)
            } else {
                request.send(this)
                timeoutTime = 0;
            }

            // handle res with timeout
            timeout2Id = setTimeout(() => {
                if (request.result == undefined) { // only resolve if we haven't already
                    this.info(`Request timed out: ${outputs} ${inputs}`)
                    request.result = { result: false, message: "Request timed out." }
                    resolve(request.result)
                }

                this.removeRequest(request); // remove after timeout
            }, timeoutTime + REQUEST_TIMEOUT)
        });
    }

    onUpdate(reason: string, info: any) {
        emit(`videohubUpdate`, {
            data: this.data,
            reason: reason,
            info: info
        });
    }

    getScheduledButtons(): IUpcomingScene[] {
        return this.scheduledButtons.map(button => {
            return { id: button.id, label: button.label, time: button.time, videohubId: this.data.id, userId: button.userId, cancelled: button.cancelled }
        })
    }

    updateDefaultInput(outputId: number, inputId?: number) {
        if (outputId != undefined) {
            this.data.outputs[outputId].input_default_id = inputId == undefined ? null : inputId
        }
    }

    async logActivity(description: string, icon: string) {
        await getPrisma().videohubActivity.create({
            data: {
                title: this.data.name,
                description: description,
                icon: icon,
                time: new Date(),
                videohub_id: this.data.id,
            }
        });
    }

    addRequest(request: InputChangeRequest) {
        this.requestQueque.push(request)
    }

    checkConnectionHealth() {

        const hub = this;
        checkConnection(this.data.ip, VIDEOHUB_PORT, 5000).then(() => {
            hub.checkConnectionHealthId = setTimeout(() => {
                hub.checkConnectionHealth();
            }, CONNECTION_HEALT_CHECK_INTERVAL);
        }, async (err) => {
            hub.info("Videohub detected as not reachable.");
            console.error(err);
            await hub.onClose();
        });
    }

    scheduleCheckConnectionHealth() {
        clearTimeout(this.checkConnectionHealthId);
        this.checkConnectionHealth();
    }

    removeRequest(request: InputChangeRequest) {
        let index;
        for (let i = 0; i < this.requestQueque.length; i++) {
            if (this.requestQueque[i] === request) {
                index = i;
                break;
            }
        }

        if (index != undefined) {
            this.requestQueque.splice(index, 1);
            this.info(`Request removed: ${request.outputs} ${request.inputs}`);
        }
    }

    async sendDefaultRouting(): Promise<RoutingUpdateResult> {
        console.log("Sending default routing...")
        const outputs: number[] = []
        const inputs: number[] = []

        this.data.outputs.forEach((output: any) => {
            if (output.input_default_id != undefined) {
                outputs.push(output.id)
                inputs.push(output.input_default_id)
            }
        });

        if (outputs.length < 1) {
            return Promise.resolve({ result: true });
        }

        return await this.sendRoutingUpdateRequest(outputs, inputs)
    }

    async onClose() {
        clearTimeout(this.checkConnectionHealthId);
        this.clearReconnect();
        await this.reconnect();
    }

    connect(isInitial: boolean) {
        this.info(`Attempting connection to videohub (#${this.connectionAttempt}).`);

        if (this.socket != undefined) {
            throw new Error("Already connected");
        }

        const client = new net.Socket();
        client.connect({
            port: VIDEOHUB_PORT,
            host: this.data.ip,
        }, async () => {
            this.info("Successfully connected.");
            this.client = client;
            this.data.connected = true;
            await this.sendDefaultRouting();

            this.connectionAttempt = 0;
            this.clearReconnect();
            this.scheduleCheckConnectionHealth();
            this.onUpdate("connection_established", {});

            setTimeout(async () =>
                await this.sendDefaultRouting(), 10000);

            if (!isInitial) {
                await this.logActivity("Connection established.", ICON_CONNECTION_SUCCESS);
            }

            await this.retryFailedButtons();
        });

        client.on("data", data => {
            const text: string = data.toString();
            this.info("Received:\n" + text);

            try {
                // run async
                this.handleReceivedData(text);
            } catch (ex) {
                console.log("Failed to handle received text: " + ex);
                console.log(ex);
            }
        })

        client.on("close", async () => {
            this.info(`Connection closed (#${this.connectionAttempt})`);
            await this.onClose();
        })

        client.on("end", async () => {
            this.info(`Connection ended (#${this.connectionAttempt})`);
            await this.onClose();
        })

        client.on("error", console.error);
    }

    isConnected() {
        return this.client != undefined || this.connecting || this.data.connected;
    }

    stopScheduledButtons() {
        this.info("Stopping button schedules.")

        this.scheduledButtons.forEach(button => {
            button.stopSchedule()
        })

        this.scheduledButtons = []
    }

    async reconnect() {
        if (this.connecting != undefined) {
            return;
        }

        if (this.client != undefined) {
            this.client.removeAllListeners();
            this.client.destroy();
            this.client = undefined;
        }

        const wasConnected = this.data.connected;
        this.data.connected = false;

        if (wasConnected) {
            this.onUpdate("connection_lost", {});
            await this.logActivity("Connection lost.", ICON_ERROR)
        }

        this.connectionAttempt++;
        const delay = this.calculateReconnectTimeout();
        this.info(`Attempting reconnect (#${this.connectionAttempt}) in ${delay} ms.`);
        this.reconnectProccess(delay);
    }

    calculateReconnectTimeout() {
        if (this.connectionAttempt == 1) { // first
            return 0;
        } else if (this.connectionAttempt <= CLIENT_RECONNECT_ATTEMPTS_LOWEST) {
            return CLIENT_RECONNECT_INTERVAL_LOWEST;
        } else if (this.connectionAttempt <= CLIENT_RECONNECT_ATTEMPTS_LOW) {
            return CLIENT_RECONNECT_INTERVAL_LOW;
        } else {
            return CLIENT_RECONNECT_INTERVAL_NORMAL;
        }
    }

    reconnectProccess(timeout: number) {
        this.connecting = setTimeout(() => {
            this.connect(false);
        }, timeout);
    }

    info(msg: string) {
        console.info(`[#${this.data.id}] ${msg}`);
    }

    warn(msg: string) {
        console.warn(`[#${this.data.id}] ${msg}`)
    }

    getOutputData(id: number): IOutput {
        const output = this.getOutputDataSilent(id)
        if (output == undefined) {
            throw Error("Output doesn't exist: " + id)
        }

        return output
    }

    getOutputDataSilent(id: number): IOutput {
        const output = this.data.outputs[id]
        return output
    }

    getOutput(id: number): Output {
        const output = this.outputsObjs[id]
        if (output == undefined) {
            throw Error("Output doesn't exist: " + id)
        }

        return output
    }


    getInput(id: number) {
        if (id >= this.data.inputs.length) {
            throw Error("Input does not exist.: " + id);
        }

        return this.data.inputs[id];
    }

    async handleReceivedData(text: string) {
        const lines = getLines(text);

        let found = false;
        for (let i = 0; i < lines.length; i++) {
            if (!found) {
                const res = await this.proccesLine(lines, i);
                if (res != 0) {
                    i += res;
                    found = true;
                }
            } else {
                if (lines[i].length != 0) {
                    continue;
                }

                found = false;
            }
        }
    }

    async saveInput(id: number, label: string) {
        await getPrisma().input.upsert({
            where: {
                videohub_input: {
                    videohub_id: this.data.id,
                    id: id, // prisma requires id to start at 1
                }
            },
            create: {
                id: id,
                videohub_id: this.data.id,
                label: label,
            },
            update: {
                label: label,
            }
        })
    }

    async proccesLine(lines: string[], index: number) {
        const text = lines[index];
        if (text.length == 0) {
            return 0;
        }

        switch (text) {
            case PROTOCOL_PREAMPLE: {
                lines = getCorrespondingLines(lines, index)
                this.data.version = getConfigEntry(lines, 0)
                await this.save() // save version
                return 1
            }

            case PROTOCOL_INPUT_LABELS: {
                // inputs and outputs
                let i = 0
                for (const line of getCorrespondingLines(lines, index)) {
                    const index = line.indexOf(" ");
                    const id = Number(line.substring(0, index));
                    const label = line.substring(index + 1);

                    // save imm.
                    await this.saveInput(id, label)
                    this.data.inputs[id].label = label
                    i++
                }

                return i
            }

            case PROTOCOL_OUTPUT_LABELS: {
                // inputs and outputs
                let i = 0
                for (const line of getCorrespondingLines(lines, index)) {
                    const index = line.indexOf(" ")
                    const id = Number(line.substring(0, index))
                    const label = line.substring(index + 1)

                    const output = this.getOutput(id)
                    this.data.outputs[id].label = label
                    await output.save(label) // save imm.
                    i++
                }

                return i
            }

            case PROTOCOL_VIDEOHUB_DEVICE: {
                const entries = getCorrespondingLines(lines, index);

                let outputsAmount;
                if (entries.length > 1 || entries[0] !== "Device present: false") {
                    if (this.data.name === this.data.ip) {
                        this.data.name = getConfigEntry(entries, 2);
                    }

                    outputsAmount = Number(getConfigEntry(entries, 6));
                } else {
                    outputsAmount = 12;
                }

                if (outputsAmount === 12 || outputsAmount === 20 || outputsAmount === 40) {
                    if (this.outputsObjs.length === 0) {
                        this.outputsObjs = new Array(outputsAmount)

                        let setOutputs = false
                        if (this.data.outputs.length != outputsAmount) { // because of db
                            this.data.outputs = new Array(outputsAmount)
                            setOutputs = true
                        }

                        let setInputs = false
                        if (this.data.inputs.length != outputsAmount) { // because of db
                            this.data.inputs = new Array(outputsAmount)
                            setInputs = true
                        }

                        for (let i = 0; i < this.outputsObjs.length; i++) {
                            const outputData: IOutput = this.getOutputDataSilent(i) || { id: i, input_default_id: null, input_id: 0, label: "Unkown" };
                            const output = new Output(this, i)
                            this.outputsObjs[i] = output

                            if (setOutputs) {
                                this.data.outputs[i] = { id: i, label: outputData.label || "Unknown", input_id: outputData.input_id, input_default_id: outputData.input_default_id }
                            }

                            if (setInputs) {
                                this.data.inputs[i] = { id: i, label: "Unknown" }
                            }
                        }

                        this.info(`Setup ${this.outputsObjs.length} outputs.`)

                        // save 
                        await this.save()
                        for (const output of this.outputsObjs) {
                            await output.save("Unknown")
                        }

                        if (setInputs) {
                            for (const input of this.data.inputs) {
                                await this.saveInput(input.id, input.label)
                            }
                        }
                    }
                } else {
                    throw Error(`Invalid amount of outputs: ${outputsAmount}`)
                }

                return entries.length;
            }

            case PROTOCOL_VIDEO_OUTPUT_ROUTING: {
                let i = 0
                const arr = []
                for (const line of getCorrespondingLines(lines, index)) {
                    const data = line.split(" ")
                    const output = Number(data[0]), input = Number(data[1])
                    await this.updateRouting(output, input)
                    arr.push({
                        output: output,
                        input: input
                    })

                    i++
                }

                this.onUpdate("routing_update", { changes: arr })
                return i
            }

            case PROTOCOL_ACKNOWLEDGED: {
                const request = this.requestQueque.shift()
                if (request == undefined) {
                    throw Error("Got " + PROTOCOL_ACKNOWLEDGED + ", but no request sent.")
                }

                request.onSuccess()
                this.info("Routing update acknowledged.")
                return 1
            }

            case PROTOCOL_CONFIGURATION: {
                return 1; // skip them all 
            }

            case PROTOCOL_END_PRELUDE: {
                return 0; // nothing to skip, if we would return 1, then unexpected results since it's only one line ++
            }

            case PROTOCOL_VIDEO_OUTPUT_LOCKS: {
                return 1; // skip them all
            }

            default: {
                this.warn(`Unknown message. Start: ${text}`);
                return 0;
            }
        }
    }

    async updateRouting(output_id: number, input_id: number) {
        const output = this.getOutput(output_id)
        const outputData = this.data.outputs[output_id]
        outputData.input_id = input_id
        output.updateRouting(input_id)
        this.data.lastRoutingUpdate = new Date()
        await output.save(outputData.label)
    }

    async save() {
        this.info("Saving...");
        await getPrisma().videohub.update({
            where: {
                id: this.data.id,
            },
            data: {
                name: this.data.name,
            }
        })

        this.info("Saved.");
    }

    clearReconnect() {
        if (this.connecting == undefined) {
            return;
        }

        clearInterval(this.connecting);
        this.connecting = undefined;
    }
}

let cronMidnight: any = undefined
async function executeNightly() {
    console.log(`${new Date().toLocaleString()} Executing nightly cronjob.`)
    try {
        for (const hub of getClients()) {
            await updateSunriseSet(hub)
            await hub.scheduleButtons()
        }

        // delete old ones
        const old = new Date()
        old.setMonth(old.getMonth() - 1)
        await getPrisma().videohubActivity.deleteMany({
            where: {
                time: {
                    lte: old,
                }
            }
        })

    } catch (ex) {
        console.log("Error at nightly job.")
        console.log(ex)
    }
}

function scheduleButtonsAtMidnight() {
    if (cronMidnight != undefined) {
        throw Error("Nightly cronjob already scheduled.")
    }

    // 1 0 0 * * *
    cronMidnight = new CronJob('0 0 0 * * *', async function () {
        await executeNightly()
    },
        null, // on stop function
        true, // start right now
        "Etc/UTC" // must be run in UTC, since prisma db converts all dates to UTC
    )

    console.log(`Nightly cronjob scheduled: ${new Date(cronMidnight.nextDates())}`)
}


export async function setupVideohubs() {
    if (getClients() != undefined) {
        throw Error("Already initialized")
    }

    const videohubs: Videohub[] = []
    cache.set("videohubs", videohubs);

    console.log("Loading data...")
    const arr: any[] = await getPrisma().videohub.findMany({
        include: {
            inputs: true,
            outputs: true,
        }
    });

    arr.forEach((e: any) => {
        // turn into objects
        for (let i = 0; i < e.outputs.length; i++) {
            const output = e.outputs[i]
            e.outputs[i] = { id: output.id, label: output.label, input_id: output.input_id, input_default_id: output.input_default_id == undefined ? null : output.input_default_id }
            const input = e.inputs[i];
            e.inputs[i] = { id: input.id, label: input.label }
        }

        videohubs.push(new Videohub(e))
    })

    console.log("Connecting to videohubs.");
    for (const hub of getClients()) {
        if (hub.isConnected()) {
            throw Error("Already connected");
        }

        // await hub.scheduleButtons() alr at execute nightly
        hub.reconnect()
    }

    await executeNightly()
    scheduleButtonsAtMidnight()
}

export function getVideohubs() {
    return getClients().map(client => client.data);
}

export function getVideohubClient(id: number): Videohub | undefined {
    for (const hub of getClients()) {
        if (hub.data.id === id) {
            return hub;
        }
    }
}

export function getVideohub(id: number): IVideohub | undefined {
    for (const hub of getClients()) {
        if (hub.data.id === id) {
            return hub.data;
        }
    }

    return undefined;
}

export function sendRoutingUpdate(videohub_id: number, outputs: number[], inputs: number[]): Promise<RoutingUpdateResult> {
    const videohubClient = getClient(videohub_id);
    if (videohubClient == undefined) {
        throw Error("Client not found: " + videohub_id);
    }

    return videohubClient.sendRoutingUpdateRequest(outputs, inputs)
}

export function executeButton(videohub_id: number, button_id: number) {
    const videohubClient = getClient(videohub_id);
    if (videohubClient == undefined) {
        throw Error("Client not found: " + videohub_id);
    }

    return videohubClient.executeButton(button_id)
}

export function getScheduledButton(videohubId: number, buttonId: number) {
    const videohubClient = getClient(videohubId);
    if (videohubClient == undefined) {
        throw Error("Client not found: " + videohubId);
    }

    return videohubClient.getScheduledButton(buttonId)
}

export async function handleButtonReSchedule(videohubId: number, buttonId: number) {
    const videohubClient = getClient(videohubId);
    if (videohubClient == undefined) {
        throw Error("Client not found: " + videohubId);
    }

    await videohubClient.handleButtonReSchedule(buttonId)
}

export function handleButtonDeletion(buttonId: number) {
    for (const client of getClients()) {
        client.removeScheduledButton(buttonId)
    }
}

export function getScheduledButtons(videohubId: number): IUpcomingScene[] {
    const videohubClient = getClient(videohubId);
    if (videohubClient == undefined) {
        return [];
    }

    return videohubClient.getScheduledButtons();
}

export function updateDefaultInput(videohubId: number, outputId: number, inputId?: number) {
    const videohubClient = getClient(videohubId)
    if (videohubClient == undefined) {
        throw Error("Client not found: " + videohubId)
    }

    return videohubClient.updateDefaultInput(outputId, inputId)
}

export function getClients(): Videohub[] {
    const videohubs: any = cache.get("videohubs");
    return videohubs;
}

export function getClient(id: number): Videohub | undefined {
    for (const client of getClients()) {
        if (client.data.id === id) {
            return client;
        }
    }

    return undefined
}


