const nano = require('nano')

const TAG = 'COUCH'

const STATS_KEY_NAME = 'STATS'

const DEFAULT_DELETE_STORE = false

class CouchWriter {
  constructor({
    connection,
    storeName,
    deleteOnStart = DEFAULT_DELETE_STORE,
  } = {}) {

    if (!connection || !storeName) {
      throw new Error(`[${TAG}] Missing connection or store name`)
    }

    this._storeName = storeName
    this._connection = connection

    this._statsRevId = undefined

    this._deleteOnStart = deleteOnStart
  }

  async prepare() {
    console.info(`[${TAG}] Preparing output couchdb store "${this._storeName}"`)

    this._nano = nano(`${this._connection}`)

    this._db = this._nano.use(this._storeName)

    if (this._deleteOnStart) {
      try {
        await this._nano.db.destroy(this._storeName)
      } catch (err) {
        if (err.error !== 'not_found') throw err
      }

      await this._nano.db.create(this._storeName)
    } else {
      try {
        await this._nano.db.create(this._storeName)
      } catch (err) {
        if (err.error !== 'file_exists') throw err
      }
    }

    try {
      const stats = await this._db.get(STATS_KEY_NAME)

      this._statsRevId = stats['_rev']
    } catch (err) {
      if (err.error !== 'not_found') throw err
    }

    return this
  }

  async save(data) {
    console.debug(`[${TAG}] Writing ${data.length} lines`)

    const docs = data
      .filter(filterEntry)
      .map(prepareEntry)

    await this._db.bulk({ docs: docs })

    return docs.length
  }

  finish(stats) {
    console.info(`[${TAG}] Finishing up`)

    return this.updateStats(stats)
  }

  async updateStats(stats) {
    console.debug(`[${TAG}] Updating status`)

    const data = Object.assign({}, stats, {
      _id: STATS_KEY_NAME,
      _rev: this._statsRevId,
    })

    const res = await this._db.insert(data)

    this._statsRevId = res['rev']
  }
}

function filterEntry(entry) {
  if (!entry || entry.id === undefined) {
    console.warn(`[${TAG}] Missing entry id, skipping save`, entry)
    return false
  }

  return true
}

function prepareEntry(entry) {
  return Object.assign({}, entry, {
    _id: entry['id'],
  })
}

module.exports = CouchWriter
