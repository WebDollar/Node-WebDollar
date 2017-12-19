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
        }).catch((err) => {
            assert(err !== null, err);
        });
    });
    
    it('save/remove/get sample test', () => {

        key = '2';
        value = 'myValue_2';
        db = new InterfacePouchDB('MyDatabase');
        
        db.save(key, value);
        db.remove(key);
        
        return db.get(key).then((result) => {
            assert(false, 'get: ' + result.value + 'found after remove');
        }).catch((err) => {
            assert(err.name === 'not_found', err);
        });
    });
    
    it('save/save/get sample test', () => {

        key = '2';
        value = 'myValue_2';
        db = new InterfacePouchDB('MyDatabase');
        
        db.save(key, value);
        db.save(key, 'modified_value');
        
        return db.get(key).then((result) => {
            assert(result.value === 'modified_value', 'get: ' + result.value + 'found after remove');
        }).catch((err) => {
            assert(err.name === 'not_found', err);
        });
    });
    
    it('remove nonexistent key', () => {

        key = '1234';
        db = new InterfacePouchDB('MyDatabase');
        

        db.save(key, 'modified_value');
        
        return db.db.remove(key).then((result) => {
            assert(result.value === 'modified_value', 'get: ' + result.value + 'found after remove');
        }).catch((err) => {
            assert(err.name === 'not_found', err);
        });
    });
    
});