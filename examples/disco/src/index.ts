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

(async () => {
    const lh = new LighthouseWebsocket(auth);
    await lh.open();

    lh.addKeyListener(e => {
        console.log(`Got key input: ${JSON.stringify(e)}`);
    });

    lh.addControllerListener(e => {
        console.log(`Got controller input: ${JSON.stringify(e)}`);
    });

    let i = 0;
    // eslint-disable-next-line no-constant-condition
    while (true) {
        // eslint-disable-next-line no-loop-func
        const data = new Uint8Array(LIGHTHOUSE_WIDTH * LIGHTHOUSE_HEIGHT * 3).map((_, j) => (j % 3 === i ? 255 : 0));
        await lh.sendDisplay(data);

        i += 1;
        i %= 3;
        await sleep(1000 / 5);
    }
})();
