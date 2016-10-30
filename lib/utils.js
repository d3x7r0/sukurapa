let Bluebird = require("bluebird"),
    Logger = require('winston');

let DEFAULT_DELAY = 1000;

const TAG = "UTILS";

function delay(time) {
    time = time === undefined ? DEFAULT_DELAY : time;

    return function doDelay(data) {
        Logger.debug(`[${TAG}] Delaying ${time} milliseconds between requests`);
        return Bluebird.delay(time, data);
    };
}

let QUEUE = Bluebird.resolve();

function queue(fn, data) {
    let delayer = delay();

    let ret = QUEUE.then(() => fn(data));

    QUEUE = ret.then(delayer, delayer);

    return ret;
}

module.exports = {
    DEFAULT_DELAY: DEFAULT_DELAY,
    delay: delay,
    queue: queue
};