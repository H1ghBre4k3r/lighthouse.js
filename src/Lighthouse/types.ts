export type LighthouseVerb = "POST" | "CREATE" | "MKDIR" | "DELETE" | "LIST" | "GET" | "PUT" | "STREAM" | "STOP" | "LINK" | "UNLINK";

export interface LighthouseAuth<U extends string> {
    USER: U;
    TOKEN: string;
}

export interface LighthouseRequest<U extends string, P> {
    REID: string;
    AUTH: LighthouseAuth<U>;
    VERB: LighthouseVerb;
    PATH: ["user", U, "model"];
    META: object;
    PAYL: P;
}

export interface LighthouseEvent<P> {
    REID: string;
    RNUM: number;
    RESPONSE: string;
    META: object;
    PAYL: P;
    WARNINGS: string[];
}
