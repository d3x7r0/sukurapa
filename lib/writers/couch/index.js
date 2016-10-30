let nano = require("nano"),
    Bluebird = require("bluebird"),
    Logger = require('winston');

const TAG = "COUCH";

const STATS_KEY_NAME = "STATS";

const DEFAULT_DELETE_STORE = false;

function CouchWriter(options) {
    if (!(this instanceof CouchWriter)) {
        return new CouchWriter(options);
    }

    options = options || {};

    if (!options.connection || !options.storeName) {
        throw new Error(`[${TAG}] Missing connection or store name`);
    }

    this._storeName = options.storeName;
    this._connection = options.connection;

    this._statsRevId = undefined;

    this._deleteOnStart = options.deleteOnStart === undefined ? DEFAULT_DELETE_STORE : options.deleteOnStart;
}

CouchWriter.prototype.prepare = function prepare() {
    Logger.info(`[${TAG}] Preparing output couchdb store "${this._storeName}"`);

    this._nano = nano(`${this._connection}`);

    let db = this._nano.use(this._storeName);

    this._dbInsert = Bluebird.promisify(db.insert);
    this._dbBulkInsert = Bluebird.promisify(db.bulk);

    let dbGet = Bluebird.promisify(db.get),
        dbCreate = Bluebird.promisify(this._nano.db.create);

    let create = () => dbCreate(this._storeName);

    let p;

    if (this._deleteOnStart) {
        let dbDelete = Bluebird.promisify(this._.db.delete);

        p = dbDelete(this._storeName).then(create, create);
    } else {
        p = create().then(
            data => data,
            err => {
                if (err.error !== "file_exists") throw err;
            }
        );
    }

    return p
        .then(() => dbGet(STATS_KEY_NAME))
        .then(
            data => {
                this._statsRevId = data['_rev'];
                return this;
            },
            (err) => {
                if (err.error === "not_found") {
                    return this;
                } else {
                    throw err;
                }
            }
        );
};

CouchWriter.prototype.save = function save(data) {
    Logger.debug(`[${TAG}] Writing ${data.length} lines`);

    let docs = data
        .map(this._prepareEntry.bind(this))
        .filter(entry => entry && entry._id !== undefined);

    return this._dbBulkInsert({docs: docs})
        .then(() => docs.length);
};

CouchWriter.prototype.finish = function finish(stats) {
    Logger.info(`[${TAG}] Finishing up`);

    return this.updateStats(stats);
};

CouchWriter.prototype.updateStats = function _updateStats(stats) {
    Logger.debug(`[${TAG}] Updating status`);

    let data = Object.assign({}, stats, {
        _id: STATS_KEY_NAME,
        _rev: this._statsRevId
    });

    return this._dbInsert(data).then((res) => {
        this._statsRevId = res["rev"];
    });
};

CouchWriter.prototype._prepareEntry = function _prepareEntry(entry) {
    if (!entry || !entry.id) {
        console.warn(`[${TAG}] Missing entry id, skipping save`, entry);
        return entry;
    }

    return Object.assign({}, entry, {
        _id: entry["id"]
    });
};

module.exports = CouchWriter;