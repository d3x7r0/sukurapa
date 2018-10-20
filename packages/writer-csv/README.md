## Synopsis

Simple file-based CSV writer for [Sukurapa](../../).

## Code Example
The CSV writer takes file names for data and statistics output files. It also requires a list of columns to print to the file (the id is always written first)

```javascript
const CSVWriter = require('@sukurapa/writer-csv');

const instance = new CSVWriter({
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
});
```

## Installation

Install using [NPM](http://npmjs.com):

`npm install @sukurapa/writer-csv`

## License

Licensed under the MIT license