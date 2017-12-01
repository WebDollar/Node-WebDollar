
var assert = require('assert')


import InterfaceRadixTree from 'common/blockchain/interface-blockchain/trees/radix-tree/Interface-Radix-Tree'
import WebDollarCryptoData from 'common/crypto/Webdollar-Crypto-Data'

describe('interfaceRadixTree', () => {


    let radix = null;

    it('creating radix tree', ()=>{

        radix = new InterfaceRadixTree();

        //Based on this tutorial https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/Patricia_trie.svg/350px-Patricia_trie.svg.png

        radix.radixAdd( new WebDollarCryptoData("romane", "ascii"), new WebDollarCryptoData("romane", "ascii") );
        radix.radixAdd( new WebDollarCryptoData("romanus", "ascii"), new WebDollarCryptoData("romanus", "ascii") );
        radix.radixAdd( new WebDollarCryptoData("romulus", "ascii"), new WebDollarCryptoData("romulus", "ascii") );
        radix.radixAdd( new WebDollarCryptoData("rubens", "ascii"), new WebDollarCryptoData("rubens", "ascii") );
        radix.radixAdd( new WebDollarCryptoData("ruber", "ascii"), new WebDollarCryptoData("ruber", "ascii") );
        radix.radixAdd( new WebDollarCryptoData("rubicon", "ascii"), new WebDollarCryptoData("rubicon", "ascii") );
        radix.radixAdd( new WebDollarCryptoData("rubicundus", "ascii"), new WebDollarCryptoData("rubicundus", "ascii") );

        let result = radix.BFS();

        assert(result.length === 5, "Radix Tree has to many levels")
        assert(result[0].length === 1, "Radix Tree Level 0 has different nodes")
        assert(result[1].length === 1, "Radix Tree Level 1 has different nodes")
        assert(result[2].length === 2, "Radix Tree Level 2 has different nodes")
        assert(result[3].length === 4, "Radix Tree Level 3 has different nodes")
        assert(result[4].length === 6, "Radix Tree Level 4 has different nodes")

        radix.printBFS();

    });

    it ( "search radix tree", () =>{

        let result1 = radix.radixSearch ( new WebDollarCryptoData("romane", "ascii") );
        let result2 = radix.radixSearch ( new WebDollarCryptoData("romanus", "ascii") );
        let result3 = radix.radixSearch ( new WebDollarCryptoData("romulus", "ascii") );
        let result4 = radix.radixSearch ( new WebDollarCryptoData("rubens", "ascii") );
        let result5 = radix.radixSearch ( new WebDollarCryptoData("ruber", "ascii") );
        let result6 = radix.radixSearch ( new WebDollarCryptoData("rubicon", "ascii") );
        let result7 = radix.radixSearch ( new WebDollarCryptoData("rubicundus", "ascii") );

        let result8 = radix.radixSearch ( new WebDollarCryptoData("rubicundusxx", "ascii") );
        let result9 = radix.radixSearch ( new WebDollarCryptoData("ruberr", "ascii") );

        //console.log(result1);

        assert (result1.result === true, "result1 was not found");
        assert (result2.result === true, "result2 was not found");
        assert (result3.result === true, "result3 was not found");
        assert (result4.result === true, "result4 was not found");
        assert (result5.result === true, "result5 was not found");
        assert (result6.result === true, "result6 was not found");
        assert (result7.result === true, "result7 was not found");

        assert (result8.result === false, "result8 was found");
        assert (result9.result === false, "result9 was found");
    })

});

