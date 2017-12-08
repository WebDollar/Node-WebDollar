var assert = require('assert')


import InterfaceMerkleTree from 'common/trees/merkle-tree/Interface-Merkle-Tree'
import WebDollarCryptoData from 'common/crypto/Webdollar-Crypto-Data'

import TestsHelper from 'tests/Tests.helper'

let testAddMerkleTree = ( data , tree) => {

    if (tree === null || typeof tree === 'undefined') tree = new InterfaceMerkleTree();

    data.forEach( (str)=>{
        tree.add( new WebDollarCryptoData(str, "ascii") );

        assert(tree.validateRoot() === true, "Merkle Tree is invalid!!!");
    });

    let result = tree.levelSearch();

    return {tree: tree, levels: result};
};

let testDeleteMerkleTree = () => {

};

describe('interfaceMerkleTree', () => {

    let merkleTree = new InterfaceMerkleTree();

    let merkleData = TestsHelper.makeIds(100,100, false);
    let merkleData2 = TestsHelper.makeIds(100, 100, false);

    it('creating merkle tree', ()=>{

        let result = testAddMerkleTree(merkleData, merkleTree);


        assert(result.levels.length === 2, "Merkle Tree has too many levels")
        assert(result.levels[0].length === 1, "Merkle Tree Level 0 has different nodes")
        assert(result.levels[1].length === merkleData.length, "Merkle Tree Level 1 has different nodes")

        console.log("merkle tree debug");

    });

    it ( "creating merkle tree 2nd level", () =>{

        merkleData2.forEach( (str)=>{

            let edgeIndex = merkleTree.root.edges.length;
            let parent = merkleTree.root.edges[ Math.floor( Math.random() * edgeIndex) ].targetNode;

            merkleTree.add( new WebDollarCryptoData(str, "ascii") , parent);
            assert(merkleTree.validateRoot() === true, "Merkle Tree is invalid!!!");

        });

        let result = merkleTree.levelSearch();

        assert(result.length === 3, "Merkle Tree has to many levels")
        assert(result[0].length === 1, "Merkle Tree Level 0 has different nodes")
        assert(result[1].length === merkleData.length, "Merkle Tree Level 1 has different nodes")
        assert(result[2].length === merkleData2.length, "Merkle Tree Level 2 has different nodes")

    })

    it ( "delete merkle tree", () =>{


    });

});