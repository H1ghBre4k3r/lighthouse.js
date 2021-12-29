import { config } from "dotenv";
import { LighthouseAuth, LighthouseWebsocket } from "lighouse.js";

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
        const data = new Array(28 * 14 * 3).fill(0).map((_, j) => (j % 3 === i ? 255 : 0));
        lh.send(data);
        i += 1;
        i %= 3;
        // eslint-disable-next-line no-await-in-loop
        await sleep(1000 / 5);
    }
})();
