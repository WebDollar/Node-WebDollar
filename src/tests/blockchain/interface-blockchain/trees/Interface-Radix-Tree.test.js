
var assert = require('assert')


import InterfaceRadixTree from 'common/blockchain/interface-blockchain/trees/radix-tree/Interface-Radix-Tree'
import WebDollarCryptData from 'common/crypto/Webdollar-Crypt-Data'

describe('interfaceRadixTree', () => {


    let radix = null;
    it('creating radix tree', ()=>{

        radix = new InterfaceRadixTree();
        radix.radixAdd("romane", "romane");
        radix.radixAdd("romanus", "romanus");
        radix.radixAdd("romulus", "romulus");
        radix.radixAdd("rubens", "rubens");
        radix.radixAdd("ruber", "ruber");
        radix.radixAdd("rubicon", "rubicon");
        radix.radixAdd("rubicundus", "rubicundus");

    });



});

