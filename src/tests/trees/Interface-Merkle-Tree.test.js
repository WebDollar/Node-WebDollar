
var assert = require('assert')


import InterfaceMerkleTree from 'common/trees/merkle-tree/Interface-Merkle-Tree'
import WebDollarCryptoData from 'common/crypto/Webdollar-Crypto-Data'

import TestsHelper from 'tests/Tests.helper'

describe('interfaceMerkleTree', () => {

    let merkleTree = null;

    let merkleData = TestsHelper.makeIds();
    let merkleData2 = TestsHelper.makeIds();

    it('creating merkle tree', ()=>{

        merkleTree = new InterfaceMerkleTree();

        merkleData.forEach( (str)=>{
            merkleTree.add( new WebDollarCryptoData(str, "ascii") );
        });

        let result = merkleTree.levelSearch();

        assert(result.length === 2, "Merkle Tree has too many levels")
        assert(result[0].length === 1, "Merkle Tree Level 0 has different nodes")
        assert(result[1].length === merkleData.length, "Merkle Tree Level 1 has different nodes")

        assert(merkleTree.validateTree() === true, "Merkle Tree is invalid!!!");

        //merkleTree.printLevelSearch();

    });

    it ( "creating merkle tree 2nd level", () =>{

        merkleData2.forEach( (str)=>{

            let edgeIndex = merkleTree.root.edges.length;
            let parent = merkleTree.root.edges[ Math.floor( Math.random() * edgeIndex) ].targetNode;

            merkleTree.add( new WebDollarCryptoData(str, "ascii") , parent);
        });

        let result = merkleTree.levelSearch();

        assert(result.length === 3, "Merkle Tree has to many levels")
        assert(result[0].length === 1, "Merkle Tree Level 0 has different nodes")
        assert(result[1].length === merkleData.length, "Merkle Tree Level 1 has different nodes")
        assert(result[2].length === merkleData2.length, "Merkle Tree Level 2 has different nodes")

        assert(merkleTree.validateTree() === true, "Merkle Tree is invalid!!!");

        //merkleTree.printLevelSearch();

    })

    it ( "delete merkle tree", () =>{


    });

});

