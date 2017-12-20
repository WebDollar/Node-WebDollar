var assert = require('assert')

import InterfaceIndexedDB from 'common/pouchdb/Interface-IndexedDB'

describe('interfaceIndexedDB', () => {

    let db = null;
    let result = null;
    let key = null;
    let value = null;
    
    it('creating indexedDB', ()=>{

        db = new InterfaceIndexedDB('MyDatabase');
        assert(db !== undefined, "failed to create InterfaceIndexedDB");
        assert(db !== null, "failed to create InterfaceIndexedDB");
    });
    
    it('put/get sample test', ()=>{

        db = new InterfaceIndexedDB('MyDatabase');
        assert(db !== undefined, "failed to create InterfaceIndexedDB");
        
        key = 'cosmin_key';
        value = 'cosmin_value';
        
        result = db.put('1', value);
        result = db.put('2', value);
        result = db.put('3', value);
        result = db.get('1');
        result = db.get('2');
        result = db.get('3');

        assert(false, result);
    });
});