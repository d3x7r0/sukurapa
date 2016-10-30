## Synopsis

A simple project to fetch data from a reader and push it to a writer (CouchDB, CSV)

## Code Example

To use you need to implement a reader:

```javascript
function MyReader() {
    this.data = [ "foo", "bar" ];
}

// Setup your reader and return a promise that resolves when everything is ready
MyReader.prototype.prepare = function prepare() {
    return new Promise(resolve => resolve());
}

// This method will be called every time the library needs more data.
MyReader.prototype.next = function next() {
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
MyReader.prototype.hasNext = function hasNext() {
    return this.data.length !== 0;
}

// At the end this method is called to finish up anything you need on your reader
MyReader.prototype.finish = function finish() {
    return new Promise(resolve => resolve());
}
```

And then pass it to the library along with settings for the writer:

```javascript
let Sukurapa = require('sukurapa');

// Build a new instance of the library
let instance = new Sukurapa({
    reader: new MyReader(),
    writer: {
        name: "couch",
        settings: {
            connection: "http://127.0.0.1:5984",
            storeName: 'my_store'
        }
    }
});

// And run it
instance.run();
```

## Installation

Install using [NPM](http://npmjs.com):

`npm install sukurapa`

## Available Writers

### CouchDB

The CouchDB writer takes a connection string and a store name. If the store does not exist it'll be created on the first run.

There's also the option to delete the store before each run.

```javascript
let settings = {
    "name": "couch",
    "settings": {
        "connection": "http://127.0.0.1:5984", // The connections string (mandatory)
        "storeName": "my_store", // The store name (mandatory)
        "deleteOnStart": false // whether to delete the store before starting (default: false)
    }
}
```

### CSV

The CSV writer takes file names for data and statistics output files. It also requires a list of columns to print to the file (the id is always written first)

```javascript
let settings = {
    "name": "csv",
    "settings": {
        "columns": [ // List of columns to output
            {
                "prop": "timestamp", // The property name outputed by the writter (mandatory)
                "name": "Timestamp" // The name to use in the header (optional, prop name will be used if missing)
            }
        ],
        "outFile": "out.csv", // The output file for the data (mandatory)
        "statsFile": "stats.csv", // The output file for the statistics (mandatory)
        "deleteOnStart": false // whether to delete the files before starting (default: false)
        "separator": ",", // The data separator (default: comma)
        "lineSeparator": "\n", // The line separator (default: new line)
        "arraySeparator": ";" // The array separator (default: semicolon)
    }
}
```

## License

Licensed under the MIT license