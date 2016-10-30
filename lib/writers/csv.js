let fs = require("fs"),
    Logger = require('winston');

const TAG = "CVS";

const DEFAULT_DELETE_FILE = false;

const DEFAULT_SEPARATOR = ",";
const DEFAULT_LINE_SEPARATOR = "\n";
const DEFAULT_ARRAY_SEPARATOR = ";";

function deleteFile(file) {
    return new Promise((resolve, reject) => {
        return fs.unlink(file, (err, res) => {
            return err ? reject(err) : resolve(res);
        });
    });
}

function appendFile(file, data) {
    return new Promise((resolve, reject) => {
        fs.appendFile(file, data, function (err, res) {
            return err ? reject(err) : resolve(res);
        });
    });
}

function CSVWriter(options) {
    if (!(this instanceof CSVWriter)) {
        return new CSVWriter(options);
    }

    options = options || {};

    if (!options.outFile) {
        throw new Error(`[${TAG}] Missing out file`);
    }

    if (!options.statsFile) {
        throw new Error(`[${TAG}] Missing stats file`);
    }

    this._outFile = options.outFile;
    this._statsFile = options.statsFile;

    this._columns = [{
        prop: "id"
    }].concat(options.columns, []);

    this._separator = options.separator || DEFAULT_SEPARATOR;
    this._lineSeparator = options.lineSeparator || DEFAULT_LINE_SEPARATOR;
    this._arraySeparator = options.arraySeparator || DEFAULT_ARRAY_SEPARATOR;

    this._warned = false;

    this._deleteOnStart = options.deleteOnStart === undefined ? DEFAULT_DELETE_FILE : options.deleteOnStart;
}

CSVWriter.prototype.prepare = function prepare() {
    let fn = this._writeHeader.bind(this);

    Logger.info(`[${TAG}] Preparing output file "${this._outFile}"`);

    this._warned = false;

    if (this._deleteOnStart) {
        return deleteFile(this._outFile).then(fn, fn);
    } else {
        return fn();
    }
};

CSVWriter.prototype.save = function save(data) {
    Logger.info(`[${TAG}] Writing ${data.length} lines to file`);

    let res = data.map(this._printCSVLine.bind(this)).join(this._lineSeparator);

    return appendFile(this._outFile, res + this._lineSeparator).then(() => res.length);
};

CSVWriter.prototype.finish = function finish(stats) {
    let keys = Object.keys(stats);

    let res = keys.join(this._separator);
    res += this._lineSeparator + " ";
    res += keys
        .map((k) => stats[k])
        .join(this._separator);

    return this._writeStatsFile(res);
};

CSVWriter.prototype._writeHeader = function _writeHeader() {
    let headers = this._columns.map(entry => entry.title || entry.prop);

    return appendFile(this._outFile, `${headers.join(this._separator)}\n`);
};

CSVWriter.prototype._printCSVLine = function _printCSVLine(entry) {
    let props = this._columns.map(entry => entry.prop);

    let output = props.map(prop => {
        if (Array.isArray(entry[prop])) {
            return entry[prop].join(this._arraySeparator);
        }

        return entry[prop] || "--";
    });

    return output.join(this._separator);
};

CSVWriter.prototype.updateStats = function updateStats() {
    if (!this._warned) {
        this._warned = true;
        Logger.warn(`[${TAG}] CVS writer doesn't support stats updates. All stats will be writen at the end`);
    }
};

CSVWriter.prototype._writeStatsFile = function _writeStatsFile(data) {
    let fn = () => appendFile(
        this._statsFile,
        data
    );

    if (this._deleteOnStart) {
        return deleteFile(this._statsFile).then(fn, fn);
    } else {
        return fn();
    }
};

module.exports = CSVWriter;