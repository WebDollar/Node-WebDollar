var indexeddbjs = require('indexeddb-js');
var sqlite3 = require('sqlite3');

class InterfaceIndexedDB {

    constructor(databaseName) {
        this.databaseName = databaseName;
        if(databaseName === 'undefined') 
            this.databaseName = 'MyDatabase'; 
        this.db = null;
    }

    put(inputKey, inputValue) {    
        console.log('put-------------------');
        var engine = new sqlite3.Database(':memory:');
        var scope = indexeddbjs.makeScope('sqlite3', engine);
        var request = scope.indexedDB.open(this.databaseName);

        request.onerror = function(event) {
          console.log('ERROR-put: could not open database: ' + event.target.error);
        };

        request.onupgradeneeded = function(event) {
            this.db = event.target.result;
            this.db.createObjectStore('data', {keyPath: 'key'});
        };

        request.onsuccess = function(event) {
            this.db = event.target.result;
            var store = this.db.transaction(null, 'readwrite').objectStore('data');
            store.add({key: inputKey, value: inputValue});
            /*store.get(inputKey).onsuccess = function(event) {
                var obj = event.target.result;
                console.log('record: ' + JSON.stringify(obj));
            };*/
        };

    }

    get(inputKey) {
        console.log('get-------------------');
        var engine = new sqlite3.Database(':memory:');
        var scope = indexeddbjs.makeScope('sqlite3', engine);
        var request = scope.indexedDB.open(this.databaseName);

        request.onerror = function(event) {
          console.log('ERROR-get: could not open database: ' + event.target.error);
        };

        request.onupgradeneeded = function(event) {
            this.db = event.target.result;
            this.db.createObjectStore('data', {keyPath: 'key'});
        };

        request.onsuccess = function(event) {
            this.db = event.target.result;
            var store = this.db.transaction(null, 'readwrite').objectStore('data');
            //store.add({key: inputKey, value: 'valoare'});
            store.get(inputKey).onsuccess = function(event) {
                var obj = event.target.result;
                console.log('record: ' + JSON.stringify(obj));
            };
        };
    }
    
    del(inputKey) {
        console.log('del-------------------');
        var engine = new sqlite3.Database(':memory:');
        var scope = indexeddbjs.makeScope('sqlite3', engine);
        var request = scope.indexedDB.open(this.databaseName);

        request.onerror = function(event) {
          console.log('ERROR-get: could not open database: ' + event.target.error);
        };

        request.onupgradeneeded = function(event) {
            this.db = event.target.result;
            this.db.createObjectStore('data', {keyPath: 'key'});
        };

        request.onsuccess = function(event) {
            this.db = event.target.result;
            var store = this.db.transaction(null, 'readwrite').objectStore('data');
            store.delete(inputKey).onsuccess = function(event) {
                console.log('deleted the record');
            }
        };
    }

}

export default InterfaceIndexedDB