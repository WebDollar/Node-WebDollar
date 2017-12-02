
var assert = require('assert')


import InterfaceMerkleTree from 'common/trees/merkle-tree/Interface-Merkle-Tree'
import WebDollarCryptoData from 'common/crypto/Webdollar-Crypto-Data'

import TestsHelper from 'tests/tests.helper'

describe('interfaceMerkleTree', () => {

    let merkle = null;

    let merkleData = TestsHelper.makeIds();

    it('creating merkle tree', ()=>{

        merkle = new InterfaceMerkleTree();

        //Based on this tutorial https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/Patricia_trie.svg/350px-Patricia_trie.svg.png

        merkleData.forEach( (str)=>{
            merkle.add( new WebDollarCryptoData(str, "ascii") );
        });

        let result = merkle.levelSearch();

        assert(result.length === 2, "Merkle Tree has to many levels")
        assert(result[0].length === merkleData.length, "Merkle Tree Level 0 has different nodes")

        assert(merkle.validateTree === true, "Merkle Tree is invalid!!!");

        merkleData.printLevelSearch();

    });

    it ( "search merkle tree", () =>{


    })

    it ( "delete merkle tree", () =>{


    });

});

