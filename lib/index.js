let Bluebird = require('bluebird'),
    Logger = require('winston'),
    Utils = require('./utils');

const TAG = "CORE";

function Runner(settings) {
    if (!(this instanceof Runner)) {
        return new Runner(settings);
    }

    settings = settings || {};

    if (!settings.reader) {
        throw new Error(`[${TAG}] Missing reader`);
    }

    if (!settings.writer) {
        throw new Error(`[${TAG}] Missing writer`);
    }

    this.reader = settings.reader;

    if (settings.writer && settings.writer.name) {
        this.writer = require(`./writers/${settings.writer.name}`)(settings.writer.options);
    } else {
        this.writer = settings.writer;
    }

    this._stats = {
        start: 0,
        processed: 0,
        discarded: 0,
        stored: 0
    };
}

Runner.prototype.run = function run() {
    this._stats.start = Date.now();

    return Bluebird
        .all([
            this.reader.prepare(),
            this.writer.prepare()
        ])
        .then(() => this._processPage())
        .then(() => this._collectStats())
        .then((stats) => this.writer.finish(stats))
        .then(
            () => {
                Logger.info(`[${TAG}] Finished`);
                Logger.info(`[${TAG}] Stats:\n${ JSON.stringify(this._stats, null, 2)}`);
                return this._stats;
            },
            err => {
                Logger.error(`[${TAG}] Error during run`, err);
                throw err;
            }
        );
};

Runner.prototype._processPage = function _processPage(idx) {
    idx = idx || 0;

    let processed = 0;

    if (idx === 0 || idx % 10 === 0) {
        Logger.info(`[${TAG}] Processing page ${idx}`);
    }

    if (!this.reader.hasNext()) {
        return Promise.resolve();
    }

    return this.reader.next()
        .then(data => {
            processed = data.length;
            this._stats.processed += data.length;

            return data
                .filter(entry => entry && entry.id !== undefined)
                .map(entry => Object.assign(entry, {
                    timestamp: this._stats.start,
                    id: entry.id
                }));
        })
        .then((data) => this.writer.save(data))
        .then((storedCount) => {
            this._stats.stored += storedCount;
            this._stats.discarded += processed - storedCount;

            return this.writer.updateStats(this._stats);
        })
        .then(() => this._processPage(idx + 1));
};

Runner.prototype._collectStats = function _collectStats() {
    this._stats.finish = Date.now();
    this._stats.duration = this._stats.finish - this._stats.start;

    return this._stats;
};

// Expose the utilities
Runner.Utils = Utils;

module.exports = Runner;