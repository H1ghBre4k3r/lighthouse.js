import { decode, encode } from "@msgpack/msgpack";
import { v4 as uuid } from "uuid";
import { WebSocket } from "ws";
import { LighthouseAuth, LighthousePath, LighthouseRequest, LighthouseEvent, LighthouseVerb, KeyEvent, ControllerEvent } from "./protocol";

type LighthouseEventHandler<P> = (event: LighthouseEvent<P>) => void;

export class LighthouseWebsocket<U extends string> {
    private static readonly serverAddress = "wss://lighthouse.uni-kiel.de/websocket";

    private ws?: WebSocket;

    private responseHandlers: Map<string, LighthouseEventHandler<unknown>> = new Map();
    private eventHandlers: LighthouseEventHandler<unknown>[] = [];

    constructor(private readonly auth: LighthouseAuth<U>) {}

    public async open(address = LighthouseWebsocket.serverAddress): Promise<number> {
        this.ws = new WebSocket(address);

        this.ws.on("message", (data) => {
            const response = decode(new Uint8Array(data as Buffer)) as LighthouseEvent<unknown>;
            const handler = this.responseHandlers.get(response.REID);
            if (handler && typeof handler === "function") {
                handler(response);
                this.responseHandlers.delete(response.REID);
            } else {
                for (const handler of this.eventHandlers) {
                    handler(response);
                }
            }
        });
        return new Promise<number>((res) => {
            this.ws?.once("open", (code: number) => {
                res(code);
            });
        });
    }

    public async sendDisplay(rgbValues: Uint8Array): Promise<LighthouseEvent<unknown>> {
        return await this.send("PUT", ["user", this.auth.USER, "model"], rgbValues);
    }

    public async requestStream(): Promise<LighthouseEvent<unknown>> {
        return await this.send("STREAM", ["user", this.auth.USER, "model"], undefined);
    }

    public addKeyListener(cb: (event: KeyEvent) => void): void {
        this.registerEventHandler(raw => {
            const event = raw as LighthouseEvent<KeyEvent>;
            const input = event.PAYL;
            if (input.src && input.key && input.dwn) {
                cb(input);
            }
        });
    }

    public addControllerListener(cb: (event: ControllerEvent) => void): void {
        this.registerEventHandler(raw => {
            const event = raw as LighthouseEvent<ControllerEvent>;
            const input = event.PAYL;
            if (input.src && input.btn && input.dwn) {
                cb(input);
            }
        });
    }

    private async send<P>(verb: LighthouseVerb, path: LighthousePath<U>, payload: P): Promise<LighthouseEvent<unknown>> {
        const id = uuid();
        const request: LighthouseRequest<U, P> = {
            AUTH: this.auth,
            META: {},
            PATH: path,
            PAYL: payload,
            REID: id,
            VERB: verb,
        };
        if (this.ws?.readyState === WebSocket.OPEN) {
            const prom = new Promise<LighthouseEvent<unknown>>((resolve, reject) => {
                this.registerResponseHandler(id, response => {
                    if (response.RNUM === 200) {
                        resolve(response);
                    } else {
                        reject(`${response.RNUM} ${response.RESPONSE}`);
                    }
                });
            });
            this.ws?.send(encode(request));
            return prom;
        }
        throw new Error("Websocket is currently not open!");
    }

    private registerResponseHandler<P>(id: string, cb: LighthouseEventHandler<P>): void {
        this.responseHandlers.set(id, cb as LighthouseEventHandler<unknown>);
    }

    private registerEventHandler<P>(cb: LighthouseEventHandler<P>): void {
        this.eventHandlers.push(cb as LighthouseEventHandler<unknown>);
    }

    public close(): void {
        this.ws?.close();
    }
}
