var assert = require('assert')

import InterfacePouchDB from 'common/pouchdb/Interface-PouchDB'

describe('interfacePouchDB', () => {

    let db = null;
    let result = null;
    
    it('creating PouchDB', ()=>{

        db = new InterfacePouchDB('MyDatabase');
        assert(db !== undefined, "failed to create InterfacePouchDB");
        assert(db !== null, "failed to create InterfacePouchDB");
    });
    
    it('save sample test', ()=>{

        db = new InterfacePouchDB('MyDatabase');
        assert(db !== undefined, "failed to create InterfacePouchDB");
        
        result = db.save('1', 'value1');
        
        //to be modified assertion
        assert(true, result);
    });
    
    it('save/get sample test', ()=>{

        db = new InterfacePouchDB('MyDatabase');
        assert(db !== undefined, "failed to create InterfacePouchDB");
        
        result = db.save('1', 'value1');
        result = db.get('1');
        
        //to be modified assertion
        assert(true, result);
    });
    
    it('save/update sample test', ()=>{

        db = new InterfacePouchDB('MyDatabase');
        assert(db !== undefined, "failed to create InterfacePouchDB");
        
        result = db.save('1', 'value1');
        result = db.update('1', 'value1');
        
        //to be modified assertion
        assert(true, result);
    });
    
    
});