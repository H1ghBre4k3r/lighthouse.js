/* eslint-disable no-await-in-loop */
import { config } from "dotenv";
import { LighthouseAuth, LighthouseWebsocket } from "lighthouse.js";

config();

const user = process.env.LIGHTHOUSE_USER ?? "";

const auth: LighthouseAuth<typeof user> = {
    USER: user,
    TOKEN: process.env.LIGHTHOUSE_TOKEN ?? "",
};

async function sleep(time: number) {
    return new Promise((res) => {
        setTimeout(res, time);
    });
}

(async () => {
    const lh = new LighthouseWebsocket(auth);
    await lh.open();
    let i = 0;
    // eslint-disable-next-line no-constant-condition
    while (true) {
        // eslint-disable-next-line no-loop-func
        const data = new Uint8Array(28 * 14 * 3).fill(0).map((_, j) => (j % 3 === i ? 255 : 0));
        const msg = await lh.sendDisplay(data);

        // eslint-disable-next-line no-console
        console.log(msg);
        i += 1;
        i %= 3;
        await sleep(1000 / 5);
    }
})();
