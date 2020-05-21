const TAG = "CORE"

class Runner {
  constructor({reader, writer} = {}) {
    this.reader = Runner.validateReader(reader)
    this.writer = Runner.validateWriter(writer)

    this._stats = {
      start: 0,
      processed: 0,
      discarded: 0,
      stored: 0
    }
  }

  async run() {
    this._stats.start = Date.now()

    await Promise.all([
      this.reader.prepare(),
      this.writer.prepare()
    ])

    let idx = 0

    while (this.reader.hasNext()) {
      await this._processPage(idx++)
    }

    const stats = this._collectStats()

    await Promise.all([
      this.writer.finish(stats),
      this.reader.finish()
    ])

    console.info(`[${TAG}] Finished`)
    console.info(`[${TAG}] Stats:\n${ JSON.stringify(this._stats, null, 2)}`)

    return this._stats
  }

  async _processPage(idx = 0) {
    let processed = 0

    if (idx === 0 || idx % 10 === 0) {
      console.info(`[${TAG}] Processing page ${idx}`)
    }

    const data = await this.reader.next()

    processed = data.length
    this._stats.processed += data.length

    const storedCount = await this.writer.save(
      this._cleanupData(data)
    )

    this._stats.stored += storedCount
    this._stats.discarded += processed - storedCount

    return this.writer.updateStats(this._stats)
  }

  _collectStats() {
    this._stats.finish = Date.now()
    this._stats.duration = this._stats.finish - this._stats.start

    return this._stats
  }

  _cleanupData(data = []) {
    return data
      .filter(entry => entry && entry.id !== undefined)
      .map(entry => Object.assign(entry, {
        timestamp: this._stats.start,
        id: entry.id
      }))
  }

  static validateReader(reader) {
    if (!reader) {
      throw new Error(`[${TAG}] Missing reader`)
    }

    this.checkFunctionExists(reader, 'Reader', 'prepare')
    this.checkFunctionExists(reader, 'Reader', 'next')
    this.checkFunctionExists(reader, 'Reader', 'hasNext')
    this.checkFunctionExists(reader, 'Reader', 'finish')

    return reader
  }

  static validateWriter(writer) {
    if (!writer) {
      throw new Error(`[${TAG}] Missing writer`)
    }

    this.checkFunctionExists(writer, 'Writer', 'prepare')
    this.checkFunctionExists(writer, 'Writer', 'save')
    this.checkFunctionExists(writer, 'Writer', 'finish')
    this.checkFunctionExists(writer, 'Writer', 'updateStats')

    return writer
  }

  static checkFunctionExists(reader, type, fn) {
    if (!reader[fn] || typeof reader[fn] !== 'function') {
      throw new Error(`[${TAG}] ${type} is missing '${fn}' function`)
    }
  }
}

// Export
module.exports = Runner
