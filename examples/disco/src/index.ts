/* eslint-disable no-await-in-loop */
import { config } from "dotenv";
import { LighthouseAuth, LighthouseWebsocket, LIGHTHOUSE_WIDTH, LIGHTHOUSE_HEIGHT } from "lighthouse.js";

config();

function getEnv(name: string): string {
    const value = process.env[name];
    if (!value) throw Error(`Environment variable ${name} is not defined!`);
    return value;
}

const user = getEnv("LIGHTHOUSE_USER");

const auth: LighthouseAuth<typeof user> = {
    USER: user,
    TOKEN: getEnv("LIGHTHOUSE_TOKEN"),
};

async function sleep(time: number) {
    return new Promise((res) => {
        setTimeout(res, time);
    });
}

/** Converts a color from the HSV space to RGB. */
function hsvToRgb(h: number, s: number, v: number): { r: number, g: number, b: number } {
    // Source: Wikipedia
    const hi = 6 * h;
    const hif = Math.floor(hi);
    const f = hi - hif;
    const p = v * (1 - s);
    const q = v * (1 - s * f);
    const t = v * (1 - s * (1 - f));
    switch (hif) {
    case 0: return { r: v, g: t, b: p };
    case 1: return { r: q, g: v, b: p };
    case 2: return { r: p, g: v, b: t };
    case 3: return { r: p, g: q, b: v };
    case 4: return { r: t, g: p, b: v };
    default: return { r: v, g: p, b: q };
    }
}

(async () => {
    const lh = new LighthouseWebsocket(auth);
    await lh.open();
    let i = 0;
    // eslint-disable-next-line no-constant-condition
    while (true) {
        // eslint-disable-next-line no-loop-func
        const data = new Array(LIGHTHOUSE_WIDTH * LIGHTHOUSE_HEIGHT)
            .fill(0)
            .flatMap((_, j) => {
                const x = (j % LIGHTHOUSE_WIDTH) / LIGHTHOUSE_WIDTH;
                const y = (j / LIGHTHOUSE_WIDTH) / LIGHTHOUSE_HEIGHT;
                const hue = (x + y) / 2 * Math.sin(i * 4);
                const saturation = 1;
                const value = Math.cos(i * 4);
                const { r, g, b } = hsvToRgb(hue, saturation, value);
                return [r, g, b].map(x => Math.round(x * 255));
            });
        const msg = await lh.sendDisplay(new Uint8Array(data));

        // eslint-disable-next-line no-console
        console.log(msg);
        i++;
        await sleep(1000 / 5);
    }
})();
