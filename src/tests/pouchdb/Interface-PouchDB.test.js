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
    
    it('save/get sample ASCII test', () => {

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
    
    it('save/remove/get sample ASCII test', () => {

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
    
    it('save/save/get sample ASCII test', () => {

        key = '2';
        value = 'myValue_2';
        let new_value = 'modified_value';
        db = new InterfacePouchDB('MyDatabase');
        
        db.save(key, value);
        db.save(key, new_value);
        
        return db.get(key).then((result) => {
            assert(result.value === new_value, 'get: ' + result.value + ' found old value after update');
        }).catch((err) => {
            assert(err.name === 'not_found', err);
        });
    });
    
    it('remove nonexistent ASCII key', () => {

        key = '1234';
        db = new InterfacePouchDB('MyDatabase');
        
        return db.remove(key).then((result) => {
            assert(false, 'get: ' + result.value + ' succeded to remove nonexisting key');
        }).catch((err) => {
            assert(err.name === 'not_found', err);
        });
    });
    
    //----------------------Buffer-------------------------------------------------------
        
    it('save/get sample Buffer', () => {

        key = '1';
        value = new Buffer('744FF0022AA', 'hex');
        db = new InterfacePouchDB('MyDatabase');

        db.save(key, value);

        return db.get(key).then((result) => {
            assert(result.value === value, 'get: ' + result.value + '!=' + value);
        }).catch((err) => {
            assert(err !== null, err);
        });
    });
        
    it('save/remove/get sample Buffer', () => {

        key = '2';
        value = new Buffer('744FF0022AAdasdasdascasd', 'hex');
        db = new InterfacePouchDB('MyDatabase');
        
        db.save(key, value);
        db.remove(key);
        
        return db.get(key).then((result) => {
            assert(false, 'get: ' + result.value + ' found after remove');
        }).catch((err) => {
            assert(err.name === 'not_found', err);
        });
    });
    
    it('save/save/get sample Buffer test', () => {

        key = '2';
        value = new Buffer('744F234dasdasdascasd', 'hex');
        let new_value = new Buffer('744casd', 'hex');
        db = new InterfacePouchDB('MyDatabase');
        
        db.save(key, value);
        db.save(key, new_value);
        
        return db.get(key).then((result) => {
            assert(result.value === value, 'get: ' + result.value + ' found old value after update');
        }).catch((err) => {
            assert(err.name === 'not_found', err);
        });
    });
    
    it('remove nonexistent Buffer test', () => {

        key = '1234567';
        db = new InterfacePouchDB('MyDatabase');
        
        return db.remove(key).then((result) => {
            assert(false, 'get: ' + result.value + ' succeded to remove nonexisting key');
        }).catch((err) => {
            assert(err.name === 'not_found', err);
        });
    });
    
    it('save/get sample Array', () => {

        key = '1';
        value = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
        db = new InterfacePouchDB('MyDatabase');

        db.save(key, value);

        return db.get(key).then((result) => {
            for(let i = 0; i < result.value.length; ++i)
                assert(result.value[i] === value[i], 'get: ' + result.value[i] + '!=' + value[i]);
        }).catch((err) => {
            assert(err !== null, err);
        });
    });
       
    
});