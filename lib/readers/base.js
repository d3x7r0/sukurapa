

function BaseReader(options) {
}

BaseReader.prototype.prepare = function prepare() {
    return Promise.resolve();
};

BaseReader.prototype.next = function next() {
    return Promise.resolve();
};

BaseReader.prototype.hasNext = function hasNext() {
    return false;
};

BaseReader.prototype.finish = function finish() {
    return Promise.resolve();
};

module.exports = BaseReader;