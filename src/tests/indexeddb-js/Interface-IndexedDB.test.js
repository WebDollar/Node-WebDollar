var assert = require('assert')

import InterfaceIndexexDB from 'common/indexeddb-js/Interface-IndexedDB'

describe('interfaceIndexedDB', () => {

    it('creating indexedDB', ()=>{

        let db = new InterfaceIndexexDB('MyDatabase');
        assert(true, "failed to create InterfaceIndexexDB");
    });
});