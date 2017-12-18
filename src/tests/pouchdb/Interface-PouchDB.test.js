var assert = require('assert')

import InterfacePouchDB from 'common/pouchdb/Interface-PouchDB'

describe('interfacePouchDB', () => {

    let db = null;
    let result = null;
    let key = null;
    let value = null;
    
    it('creating PouchDB', ()=>{

        db = new InterfacePouchDB('MyDatabase');
        assert(db !== undefined, "failed to create InterfacePouchDB");
        assert(db !== null, "failed to create InterfacePouchDB");
    });
    
    it('save/get sample test', () => {

        key = '1';
        value = 'myValue_1';
        db = new InterfacePouchDB('MyDatabase');

        db.save(key, value);

        return db.get(key).then((result) => {
            assert(result.value === value, 'get: ' + result.value + '!=' + value);
        });
    });
    
    it('save/delete/get sample test', () => {

        key = '2';
        value = 'myValue_2';
        db = new InterfacePouchDB('MyDatabase');
        
        db.save(key, value);
        db.del(key);
        
        return db.get(key).then((result) => {
            assert(result.value === undefined, 'get: ' + result.value + '!=' + undefined);
        });
    });
    
});