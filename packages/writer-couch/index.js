const nano = require('nano');
const Logger = require('winston');
const {promisify} = require('util');

const TAG = "COUCH";

const STATS_KEY_NAME = "STATS";

const DEFAULT_DELETE_STORE = false;

class CouchWriter {
    constructor({
                    connection,
                    storeName,
                    deleteOnStart = DEFAULT_DELETE_STORE
                } = {}) {

        if (!connection || !storeName) {
            throw new Error(`[${TAG}] Missing connection or store name`);
        }

        this._storeName = storeName;
        this._connection = connection;

        this._statsRevId = undefined;

        this._deleteOnStart = deleteOnStart;
    }

    async prepare() {
        Logger.info(`[${TAG}] Preparing output couchdb store "${this._storeName}"`);

        this._nano = nano(`${this._connection}`);

        const db = this._nano.use(this._storeName);

        this._dbInsert = promisify(db.insert);
        this._dbBulkInsert = promisify(db.bulk);

        const dbGet = promisify(db.get);
        const dbCreate = promisify(this._nano.db.create);

        if (this._deleteOnStart) {
            const dbDelete = promisify(this._nano.db.destroy);

            await dbDelete(this._storeName);
            await dbCreate(this._storeName);
        } else {
            try {
                await dbCreate(this._storeName);
            } catch (err) {
                if (err.error !== "file_exists") throw err;
            }
        }

        try {
            const stats = await dbGet(STATS_KEY_NAME);

            this._statsRevId = stats['_rev'];
        } catch (err) {
            if (err.error !== "not_found") throw err;
        }

        return this;
    }

    async save(data) {
        Logger.debug(`[${TAG}] Writing ${data.length} lines`);

        const docs = data
            .filter(filterEntry)
            .map(prepareEntry);

        await this._dbBulkInsert({docs: docs});

        return docs.length;
    }

    finish(stats) {
        Logger.info(`[${TAG}] Finishing up`);

        return this.updateStats(stats);
    }

    async updateStats(stats) {
        Logger.debug(`[${TAG}] Updating status`);

        const data = Object.assign({}, stats, {
            _id: STATS_KEY_NAME,
            _rev: this._statsRevId
        });

        const res = await this._dbInsert(data);

        this._statsRevId = res["rev"];
    }
}

function filterEntry(entry) {
    if (!entry || entry.id === undefined) {
        console.warn(`[${TAG}] Missing entry id, skipping save`, entry);
        return false;
    }

    return true;
}

function prepareEntry(entry) {
    return Object.assign({}, entry, {
        _id: entry["id"]
    });
}

module.exports = CouchWriter;