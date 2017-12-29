var assert = require('assert')

import InterfaceSatoshminDB from 'common/satoshmindb/Interface-SatoshminDB'

describe('interfaceSatoshminDB', () => {

    let db = null;
    let response = null;
    let key = null;
    let value = null;
    
    it('creating SatoshminDB', ()=>{

        db = new InterfaceSatoshminDB();
        assert(db !== undefined, "failed to create InterfaceSatoshminDB");
        assert(db !== null, "failed to create InterfaceSatoshminDB");
    });
    
    it('save/get sample ASCII test', async () => {

        key = Math.floor(Math.random() * 10000).toString();;
        value = 'myValue_1';
        db = new InterfaceSatoshminDB();

        response = await db.save(key, value);
        assert(response === true, 'save: ' + response);
        
        response = await db.get(key);
        assert(response === value, 'get: ' + response + '!=' + value);

    });
    
    it('save/remove/get sample ASCII test', async () => {

        key = Math.floor(Math.random() * 10000).toString();;
        value = 'myValue_2';
        db = new InterfaceSatoshminDB();
        
        response = await db.save(key, value);
        assert(response === true, 'save:' + response);
        
        response = await db.remove(key);
        assert(response === true, 'remove: ' + response);
        
        response = await db.get(key);
        assert(response.status === 404, 'get(found after remove) :' + response);
        
    });
    
    it('save/save/get sample ASCII test', async () => {

        key = Math.floor(Math.random() * 10000).toString();;
        value = 'myValue_2';
        let new_value = 'modified_value';
        db = new InterfaceSatoshminDB();
        
        response = await db.save(key, value);
        assert(response === true, 'save: ' + response);
        
        response = await db.save(key, new_value);
        assert(response === true, 'save: ' + response);
        
        response = await db.get(key);
        assert(response === new_value, 'get: ' + response + ' found old value after update');
        
    });
    
    it('remove nonexistent ASCII test', async () => {

        key = '-1234';
        db = new InterfaceSatoshminDB();
        
        response = await db.remove(key);
        assert(response.status === 404, 'remove(found nonexisting) :' + response);
    });
    
    //----------------------Buffer-------------------------------------------------------

    it('save/get sample Buffer', async () => {

        let key = Math.floor(Math.random() * 10000).toString();
        let value = Buffer.from('4234aaffccff', 'hex');
        
        db = new InterfaceSatoshminDB();

        response = await db.save(key, value);
        assert(response === true, 'save: ' + response);
        
        response = await db.get(key);
        assert(response.equals(value), 'get: ' + response);

    });
     
    it('save/remove/get sample Buffer', async() => {

        key = Math.floor(Math.random() * 10000).toString();;
        value = new Buffer('44FF00234561217fdeca', 'hex');
        db = new InterfaceSatoshminDB();
        
        response = await db.save(key, value);
        assert(response === true, 'save: ' + response);
        
        
        response = await db.remove(key);
        assert(response === true, 'remove: ' + response);
        
        response = await db.get(key);
        assert(response.status === 404, 'get(found after remove) :' + response);
    });

    it('save/save/get sample Buffer test', async () => {

        key = Math.floor(Math.random() * 10000).toString();;
        value = new Buffer('744Fagfe4578ab', 'hex');
        let new_value = new Buffer('7444caed', 'hex');
        
        db = new InterfaceSatoshminDB();
        
        response = await db.save(key, value);
        assert(response === true, 'save: ' + response);
        
        
        response = await db.save(key, new_value)
        assert(response === true, 'save: ' + response);
        
        response = await db.get(key)
        assert(response.equals(new_value), 'get: ' + response);

    });
    
    it('remove nonexistent Buffer test', async () => {

        key = '-1234567';
        db = new InterfaceSatoshminDB();
        
        response = await db.remove(key);
        assert(response.status === 404, 'get(found after remove) :' + response);

    });
    
    it('save/get sample Array', async () => {

        key = Math.floor(Math.random() * 10000).toString();;
        value = new Buffer([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
        db = new InterfaceSatoshminDB();

        response = await db.save(key, value);
        assert(response === true, 'save: ' + response);
        
        response = await db.get(key);
        assert(response.equals(value), 'get: ' + response);

    });
    
    it('save string/update with Buffer/get sample Array', async () => {

        key = Math.floor(Math.random() * 10000).toString();;
        value = 'my string value';
        let new_value = new Buffer([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
        db = new InterfaceSatoshminDB();

        response = await db.save(key, value);
        assert(response === true, 'save: ' + response);
        
        response = await db.save(key, new_value);
        assert(response === true, 'save: ' + response);
        
        response = await db.get(key);
        assert(response.equals(new_value), 'get: ' + response);
    });
    
});