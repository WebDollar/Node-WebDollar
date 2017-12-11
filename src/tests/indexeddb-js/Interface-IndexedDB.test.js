var assert = require('assert')

import InterfaceIndexedDB from 'common/indexeddb-js/Interface-IndexedDB'

describe('interfaceIndexedDB', () => {

    it('creating indexedDB', ()=>{

        let db = new InterfaceIndexedDB('MyDatabase');
        assert(db !== 'undefined', "failed to create InterfaceIndexedDB");
    });
});