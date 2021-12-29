import { decode, encode } from "@msgpack/msgpack";
import { v4 as uuid } from "uuid";
import { WebSocket } from "ws";
import { LighthouseAuth, RequestPayload, ResponsePayload } from "./types";

type ResponseHandler = (data: ResponsePayload) => void;

export class LighthouseWebsocket<U extends string> {
    private static readonly serverAdress = "wss://lighthouse.uni-kiel.de/websocket";

    private ws?: WebSocket;

    private responseHandlers: Map<string, ResponseHandler>;

    constructor(private readonly auth: LighthouseAuth<U>) {
        this.responseHandlers = new Map<string, ResponseHandler>();
    }

    public async open(adress = LighthouseWebsocket.serverAdress): Promise<number> {
        this.ws = new WebSocket(adress);

        this.ws.on("message", (data) => {
            const response: ResponsePayload = decode(new Uint8Array(data as Buffer)) as ResponsePayload;
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

    public async send(payload: number[]): Promise<ResponsePayload> {
        const id = uuid();
        const data: RequestPayload<U> = {
            AUTH: this.auth,
            META: {},
            PATH: ["user", this.auth.USER, "model"],
            PAYL: new Uint8Array(payload),
            REID: id,
            VERB: "PUT",
        };
        if (this.ws?.readyState === WebSocket.OPEN) {
            const prom = new Promise<ResponsePayload>((res) => {
                this.registerResponseHandler(id, res);
            });
            this.ws?.send(encode(data));
            return prom;
        }
        throw new Error("Websocket is currently not open!");
    }

    private registerResponseHandler(id: string, cb: ResponseHandler) {
        this.responseHandlers.set(id, cb);
    }

    public close(): void {
        this.ws?.close();
    }
}
