type Verb = "POST" | "CREATE" | "MKDIR" | "DELETE" | "LIST" | "GET" | "PUT" | "STREAM" | "STOP" | "LINK" | "UNLINK";

export interface LighthouseAuth<U extends string> {
    USER: U;
    TOKEN: string;
}

export interface RequestPayload<U extends string> {
    REID: string;
    AUTH: LighthouseAuth<U>;
    VERB: Verb;
    PATH: ["user", U, "model"];
    META: object;
    PAYL: unknown;
}

export interface ResponsePayload {
    REID: string;
    RNUM: number;
    RESPONSE: string;
    META: object;
    PAYL: unknown;
    WARNINGS: string[];
}
