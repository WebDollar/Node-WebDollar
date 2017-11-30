
var assert = require('assert')


import InterfaceRadixTree from 'common/blockchain/interface-blockchain/trees/radix-tree/Interface-Radix-Tree'
import WebDollarCryptoData from 'common/crypto/Webdollar-Crypto-Data'

describe('interfaceRadixTree', () => {


    let radix = null;

    it('creating radix tree', ()=>{

        radix = new InterfaceRadixTree();
        radix.radixAdd( new WebDollarCryptoData("romane", "ascii"), new WebDollarCryptoData("romane", "ascii") );
        radix.radixAdd( new WebDollarCryptoData("romanus", "ascii"), new WebDollarCryptoData("romanus", "ascii") );
        radix.radixAdd( new WebDollarCryptoData("romulus", "ascii"), new WebDollarCryptoData("romulus", "ascii") );
        radix.radixAdd( new WebDollarCryptoData("rubens", "ascii"), new WebDollarCryptoData("rubens", "ascii") );
        radix.radixAdd( new WebDollarCryptoData("ruber", "ascii"), new WebDollarCryptoData("ruber", "ascii") );
        radix.radixAdd( new WebDollarCryptoData("rubicon", "ascii"), new WebDollarCryptoData("rubicon", "ascii") );
        radix.radixAdd( new WebDollarCryptoData("rubicundus", "ascii"), new WebDollarCryptoData("rubicundus", "ascii") );

        radix.printBFS();

    });



});

