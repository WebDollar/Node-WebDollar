var indexeddbjs = require('indexeddb-js');
var sqlite3 = require('sqlite3');

var engine = new sqlite3.Database(':memory:');
var scope = indexeddbjs.makeScope('sqlite3', engine);

class InterfaceIndexexDB {

    constructor(databaseName) {
        if (databaseName === 'undefined') databaseName = 'MyDatabase';

        this.request = scope.indexedDB.open(databaseName);

        this.request.onerror = function (event) {
            console.log('ERROR: could not open database: ' + event.target.error);
        };

        this.request.onupgradeneeded = function (event) {
            this.db = event.target.result;
        };

        this.request.onsuccess = function (event) {
            db = event.target.result;
            request.run();
        };
    }

    put(key, value) {

    }

    get(key) {

    }

}

export default InterfaceIndexexDB