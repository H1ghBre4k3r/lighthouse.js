import { encode } from "@msgpack/msgpack";
import { v4 as uuid } from "uuid";
import { WebSocket } from "ws";
import { LighthouseAuth, RequestPayload } from "./types";

export class LighthouseWebsocket<U extends string> {
    private static readonly serverAdress = "wss://lighthouse.uni-kiel.de/websocket";

    private ws?: WebSocket;

    // eslint-disable-next-line no-useless-constructor
    constructor(private readonly auth: LighthouseAuth<U>) {}

    public async open(adress = LighthouseWebsocket.serverAdress): Promise<number> {
        this.ws = new WebSocket(adress);
        return new Promise<number>((res) => {
            this.ws?.once("open", (code: number) => {
                res(code);
            });
        });
    }

    public send(payload: number[]): void {
        const data: RequestPayload<U> = {
            AUTH: this.auth,
            META: {},
            PATH: ["user", this.auth.USER, "model"],
            PAYL: new Uint8Array(payload),
            REID: uuid(),
            VERB: "PUT",
        };
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws?.send(encode(data));
        } else {
            throw new Error("Websocket is currently not open!");
        }
    }

    public close(): void {
        this.ws?.close();
    }
}
