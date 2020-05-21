const fs = require("fs")
const {promisify} = require('util')

const TAG = "CVS"

const DEFAULT_DELETE_FILE = false

const DEFAULT_SEPARATOR = ","
const DEFAULT_LINE_SEPARATOR = "\n"
const DEFAULT_ARRAY_SEPARATOR = ";"

const deleteFile = promisify(fs.unlink)
const appendFile = promisify(fs.appendFile)

class CSVWriter {
  constructor({
    outFile,
    statsFile,
    columns = [],
    separator = DEFAULT_SEPARATOR,
    lineSeparator = DEFAULT_LINE_SEPARATOR,
    arraySeparator = DEFAULT_ARRAY_SEPARATOR,
    deleteOnStart = DEFAULT_DELETE_FILE
  } = {}) {

    if (!outFile) {
      throw new Error(`[${TAG}] Missing out file`)
    }

    if (!statsFile) {
      throw new Error(`[${TAG}] Missing stats file`)
    }

    this._outFile = outFile
    this._statsFile = statsFile

    this._columns = [
      {prop: "id"},
      ...(columns || [])
    ]

    this._separator = separator
    this._lineSeparator = lineSeparator
    this._arraySeparator = arraySeparator

    this._warned = false

    this._deleteOnStart = deleteOnStart
  }

  async prepare() {
    console.info(`[${TAG}] Preparing output file "${this._outFile}"`)

    this._warned = false

    if (this._deleteOnStart) {
      await deleteFile(this._outFile)
    }

    return await this._writeHeader()
  }

  async save(data) {
    console.info(`[${TAG}] Writing ${data.length} lines to file`)

    const res = data.map(this._printCSVLine.bind(this)).join(this._lineSeparator)

    await appendFile(this._outFile, res + this._lineSeparator)

    return res.length
  }

  async finish(stats) {
    const keys = Object.keys(stats)

    let res = keys.join(this._separator)
    res += this._lineSeparator + " "
    res += keys
      .map((k) => stats[k])
      .join(this._separator)

    return await this._writeStatsFile(res)
  }

  _writeHeader() {
    const headers = this._columns.map(entry => entry.title || entry.prop)

    return appendFile(this._outFile, headers.join(this._separator) + this._lineSeparator)
  }

  _printCSVLine(entry) {
    return this._columns
      .map(entry => entry.prop)
      .map(
        prop => Array.isArray(entry[prop]) ?
          entry[prop].join(this._arraySeparator) :
          entry[prop] || "--"
      )
      .join(this._separator)
  }

  updateStats() {
    if (!this._warned) {
      this._warned = true
      console.warn(`[${TAG}] CVS writer doesn't support stats updates. All stats will be writen at the end`)
    }
  }

  async _writeStatsFile(data) {
    if (this._deleteOnStart) {
      await deleteFile(this._statsFile)
    }

    return await appendFile(this._statsFile, data)
  }
}

module.exports = CSVWriter
