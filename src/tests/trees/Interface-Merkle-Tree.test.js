var assert = require('assert')


import InterfaceMerkleTree from 'common/trees/merkle-tree/Interface-Merkle-Tree'
import WebDollarCryptoData from 'common/crypto/Webdollar-Crypto-Data'

import TestsHelper from 'tests/Tests.helper'

let testAddMerkleTree = ( data , tree) => {

    if (tree === null || typeof tree === 'undefined') tree = new InterfaceMerkleTree();

    data.forEach( (str, index)=>{
        tree.add( new WebDollarCryptoData(str, "ascii") );

        assert(tree.validateRoot() === true, "Merkle Tree is invalid!!!");

        data.forEach( (str2, index2)=> {

            let find = false;
            if (index2 <= index) find = true;

            assert( (tree.search(new WebDollarCryptoData(str2, "ascii")) !== null) === find, "When adding "+str.toString()+" couldn't find item" + str2.toString() + " although it added or not")
        });
    });

    let result = tree.levelSearch();
    return {tree: tree, levels: result};
};

let testDeleteMerkleTree = (data, tree) => {

    if (tree === null || typeof tree === 'undefined') tree = new InterfaceMerkleTree();

    while (data.length > 0){

        let index = Math.floor(Math.random()*data.length);
        let value = data[index];

        console.log('1');
        let node = tree.search( new WebDollarCryptoData(value, "ascii") );

        assert(node !== null, "Couldn't find item "+value.toString() );
        console.log('2');
        assert( tree.delete(node) === true, "Couldn't delete item" );
        console.log('3');
        assert(tree.validateRoot() === true, "Merkle Tree is invalid!!!");
        console.log('4');
        data.splice(index, 1);

        for (let j=0; j<data.length; j++)
            assert ( tree.search(  new WebDollarCryptoData( data[j], "ascii")) !== null , "Couldn't find item" + value.toString()+" although it was not deleted")

        console.log('5');
        console.log(data.length);
    }

    let result = tree.levelSearch();

    assert(result.length === 1, "result is not 1 level");
    assert(result[0].length === 1, "root is not empty");

    return {tree: tree, levels: result};

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

        testDeleteMerkleTree( merkleData.concat(merkleData2), merkleTree,)

    });

});