var assert = require('assert')

import InterfacePouchDB from 'common/pouchdb/Interface-PouchDB'

describe('interfacePouchDB', () => {

    let db = null;
    let response = null;
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

        return db.save(key, value).then((response) => {
            return db.get(key).then((response) => {
                assert(response === value, 'get: ' + response + '!=' + value);
            }).catch((err) => {
                assert(false, err);
            });
        });
    });
    
    it('save/remove/get sample ASCII test', () => {

        key = '2';
        value = 'myValue_2';
        db = new InterfacePouchDB('MyDatabase');
        
        return db.save(key, value).then((responde) => {
            return db.remove(key).then((response) => {
                return db.get(key).then((response) => {
                    assert(false, 'get: ' + response + 'found after remove');
                }).catch((err) => {
                    assert(err.name === 'not_found', err);
                });
            });
        });

    });
    
    it('save/save/get sample ASCII test', () => {

        key = '2';
        value = 'myValue_2';
        let new_value = 'modified_value';
        db = new InterfacePouchDB('MyDatabase');
        
        return db.save(key, value).then((response) => {
            return db.save(key, new_value).then((response) => {
                return db.get(key).then((response) => {
                    assert(response === new_value, 'get: ' + response + ' found old value after update');
                }).catch((err) => {
                    assert(false, err);
                });
            });
        });
    });
    
    it('remove nonexistent ASCII key', () => {

        key = '1234';
        db = new InterfacePouchDB('MyDatabase');
        
        return db.remove(key).then((response) => {
            assert(false, 'get: ' + response + ' succeded to remove nonexisting key');
        }).catch((err) => {
            assert(err.name === 'not_found', err);
        });
    });
    
    //----------------------Buffer-------------------------------------------------------
        
    it('save/get sample Buffer', () => {

        key = '1';
        value = new Buffer('744FF0022AA', 'hex');
        db = new InterfacePouchDB('MyDatabase');

        return db.save(key, value).then((response) => {
            return db.get(key).then((response) => {
                assert(value.equals(response), 'get: ' + response + '!=' + value);
            }).catch((err) => {
                assert(false, err);
            });
        });
    });
        
    it('save/remove/get sample Buffer', () => {

        key = '2';
        value = new Buffer('744FF0022AAdasdasdascasd', 'hex');
        db = new InterfacePouchDB('MyDatabase');
        
        return db.save(key, value).then((response) => {
            return db.remove(key).then((response) => {
                return db.get(key).then((response) => {
                    assert(false, 'get: ' + response + ' found after remove');
                }).catch((err) => {
                    assert(err.name === 'not_found', err);
                });
            });
        });
    });
    
    it('save/save/get sample Buffer test', () => {

        key = '2';
        value = new Buffer('744F234dasdasdascasd', 'hex');
        let new_value = new Buffer('744casd', 'hex');
        db = new InterfacePouchDB('MyDatabase');
        
        return db.save(key, value).then((response) => {
             return db.save(key, new_value).then((response) => {
                return db.get(key).then((response) => {
                    assert(new_value.equals(response), 'get: ' + response + ' found old value after update');
                }).catch((err) => {
                    assert(false, err);
                });
             });
        });
    });
    
    it('remove nonexistent Buffer test', () => {

        key = '1234567';
        db = new InterfacePouchDB('MyDatabase');
        
        return db.remove(key).then((response) => {
            assert(false, 'get: ' + response + ' succeded to remove nonexisting key');
        }).catch((err) => {
            assert(err.name === 'not_found', err);
        });
    });
    
    it('save/get sample Array', () => {

        key = '1';
        value = new Buffer([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
        db = new InterfacePouchDB('MyDatabase');

        return db.save(key, value).then((response) => {
            return db.get(key).then((response) => {
                assert(value.equals(response), 'buffer are different: ' + response + '!=' + value);
            }).catch((err) => {
                assert(false, err);
            });
        });
    });
    
    it('save string/update with Buffer/get sample Array', () => {

        key = '1';
        value = 'my string value';
        let new_value = new Buffer([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
        db = new InterfacePouchDB('MyDatabase');

        return db.save(key, value).then((response) => {
            return db.save(key, new_value).then((response) => {
                return db.get(key).then((response) => {
                    assert(new_value.equals(response), 'buffer are different: ' + response + '!=' + value);
                }).catch((err) => {
                    assert(false, err);
                });
            });
        });
    });
    
});