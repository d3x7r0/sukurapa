## Synopsis

A simple project to fetch data from a reader and push it to a writer

## Code Example

To use you need to implement a reader:

```javascript
class MyReader {
    constructor() {
        this.data = [ "foo", "bar" ];
    }

    // Setup your reader and return a promise that resolves when everything is ready
    prepare() {
        return new Promise(resolve => resolve());
    }

    // This method will be called every time the library needs more data.
    next() {
        return new Promise(resolve => {
            let entry = this.data.pop();
    
            // Your object needs to have an id property. That will be used as the couchdb id (for example)
            resolve({
                id: entry,
                value: entry
            });
        });
    }

    // This method is called before each iteration to know if there's more data to read
    hasNext() {
        return this.data.length !== 0;
    }
    
    // At the end this method is called to finish up anything you need on your reader
    finish() {
        return new Promise(resolve => resolve());
    }
}
```

// And then pass it to the library along with an instance of a Writer:

```javascript
const Sukurapa = require('sukurapa');
const CouchWriter = require('@sukurapa/writer-couch');

// Build a new instance of the library
const instance = new Sukurapa({
    reader: new MyReader(),
    writer: new CouchWriter({
        connection: "http://127.0.0.1:5984",
        storeName: 'my_store'
    })
});

// And run it
instance.run().then(
    stats => console.log(stats),
    err => console.error(err.message, err)
);
```

## Installation

Install using [NPM](http://npmjs.com):

`npm install sukurapa`

## Available Writers

* [CouchDB](packages/writer-couch)
* [CSV](packages/writer-csv)

## License

Licensed under the MIT license