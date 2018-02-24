## Synopsis

CouchDB writer based on [nano](https://github.com/apache/couchdb-nano) for [Sukurapa](../../).

## Code Example
The CouchDB writer takes a connection string and a store name. If the store does not exist it'll be created on the first run.

There's also the option to delete the store before each run.

```javascript
const instance = new CouchWriter({
    "connection": "http://127.0.0.1:5984", // The connections string (mandatory)
    "storeName": "my_store", // The store name (mandatory)
    "deleteOnStart": false // whether to delete the store before starting (default: false)
});
```

## Installation

Install using [NPM](http://npmjs.com):

`npm install sukurapa-writer-couch`

## License

Licensed under the MIT license