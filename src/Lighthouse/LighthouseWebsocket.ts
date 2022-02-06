import { decode, encode } from "@msgpack/msgpack";
import { v4 as uuid } from "uuid";
import { WebSocket } from "ws";
import { LighthouseAuth, LighthouseRequest, LighthouseEvent } from "./types";

type LighthouseEventHandler<P> = (data: LighthouseEvent<P>) => void;

export class LighthouseWebsocket<U extends string> {
    private static readonly serverAddress = "wss://lighthouse.uni-kiel.de/websocket";

    private ws?: WebSocket;

    private responseHandlers: Map<string, LighthouseEventHandler<unknown>>;

    constructor(private readonly auth: LighthouseAuth<U>) {
        this.responseHandlers = new Map<string, LighthouseEventHandler<unknown>>();
    }

    public async open(address = LighthouseWebsocket.serverAddress): Promise<number> {
        this.ws = new WebSocket(address);

        this.ws.on("message", (data) => {
            const response = decode(new Uint8Array(data as Buffer)) as LighthouseEvent<unknown>;
            const handler = this.responseHandlers.get(response.REID);
            if (handler && typeof handler === "function") {
                handler(response);
                this.responseHandlers.delete(response.REID);
            }
        });
        return new Promise<number>((res) => {
            this.ws?.once("open", (code: number) => {
                res(code);
            });
        });
    }

    public async send<P>(payload: P): Promise<LighthouseEvent<P>> {
        const id = uuid();
        const data: LighthouseRequest<U, P> = {
            AUTH: this.auth,
            META: {},
            PATH: ["user", this.auth.USER, "model"],
            PAYL: payload,
            REID: id,
            VERB: "PUT",
        };
        if (this.ws?.readyState === WebSocket.OPEN) {
            const prom = new Promise<LighthouseEvent<P>>((res) => {
                this.registerResponseHandler(id, res);
            });
            this.ws?.send(encode(data));
            return prom;
        }
        throw new Error("Websocket is currently not open!");
    }

    private registerResponseHandler<P>(id: string, cb: LighthouseEventHandler<P>) {
        this.responseHandlers.set(id, cb as LighthouseEventHandler<unknown>);
    }

    public close(): void {
        this.ws?.close();
    }
}
