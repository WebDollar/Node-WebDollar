var assert = require('assert')

import TestsHelper from 'tests/Tests.helper'

import InterfaceMerkleRadixTree from 'common/trees/radix-tree/merkle-tree/Interface-Merkle-Radix-Tree'
import InterfaceTreeTestHelperClass from '../helpers/Interface-Tree.test.helper'
import WebDollarCryptoData from 'common/crypto/Webdollar-Crypto-Data'

let InterfaceTreeTestHelper = new InterfaceTreeTestHelperClass(InterfaceMerkleRadixTree);

describe("Interface Merkle Radix Tree", () => {

    let radixTree = null;
    let radixData = null;
    let result = null;

    it('creating merkle tree simple test', ()=>{

        console.log('a');

        let radixTree = new InterfaceMerkleRadixTree();
        radixTree.add( new WebDollarCryptoData("aaa", "ascii"), {address: "aaa"} );
        radixTree.printLevelSearch();
        assert(radixTree.validateRoot() === true, "Radix Tree after " + "aaa" + " is not Valid");

        let result = InterfaceTreeTestHelper.testAdd( ["test"] );

        radixTree = result.tree;

        console.log('x');

        ["aa"].forEach( (str)=>{

            radixTree.add( new WebDollarCryptoData(str, "ascii") , {address:"aa"} );
            radixTree.printLevelSearch();

            console.log('y');
            assert(radixTree.validateRoot() === true, "Merkle Tree is invalid!!!");
            console.log('yy');
            radixTree.delete( new WebDollarCryptoData(str, "ascii"))
            console.log('z');

            radixTree.printLevelSearch();
            assert(radixTree.validateRoot() === true, "Merkle Tree is invalid after deletion!!!");
        });

    });

    // it("creating & deleting radix tree romane ", () => {
    //
    //     //Based on this tutorial https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/Patricia_trie.svg/350px-Patricia_trie.svg.png
    //     radixData = ["romane", "romanus", "romulus", "rubens", "ruber", "rubicon", "rubicundus"];
    //
    //     result = InterfaceTreeTestHelper.testAdd(radixData);
    //
    //     assert(result.levels.length === 5, "Radix Tree has to many levels-");
    //     assert(result.levels[0].length === 1, "Radix Tree Level 0 has different nodes");
    //     assert(result.levels[1].length === 1, "Radix Tree Level 1 has different nodes");
    //     assert(result.levels[2].length === 2, "Radix Tree Level 2 has different nodes");
    //     assert(result.levels[3].length === 4, "Radix Tree Level 3 has different nodes");
    //     assert(result.levels[4].length === 6, "Radix Tree Level 4 has different nodes");
    //
    //     InterfaceTreeTestHelper.testDelete(result.tree, radixData);
    //
    // });
    //
    // it("creating & deleting merkle radix tree 3 - generalized test ", () => {
    //
    //     radixData = TestsHelper.makeIds(200, 100, false);
    //
    //     result = InterfaceTreeTestHelper.testAdd(radixData);
    //
    //     InterfaceTreeTestHelper.testDelete(result.tree, radixData);
    // });
    //
    //
    // it("creating & deleting merkle radix tree 3 - generalized test different lengths", () => {
    //
    //     radixData = TestsHelper.makeIds(200, 100, true);
    //
    //     result = InterfaceTreeTestHelper.testAdd(radixData);
    //
    //     InterfaceTreeTestHelper.testDelete(result.tree, radixData);
    // });
    //
    // it("creating & deleting merkle radix tree 4 - generalized permutation backtracking test", () => {
    //
    //     //For each permutation create a radix tree, then delete all the added words
    //     let testStrings = TestsHelper.makeIds(7, 32, true);
    //     let permutations = TestsHelper.makePermutations(testStrings);
    //
    //     //For each permutation
    //     for (let i = 0, len = permutations.length; i < len; ++i) {
    //         radixData = permutations[i];
    //
    //         console.log(radixData);
    //         result = InterfaceTreeTestHelper.testAdd(radixData);
    //
    //         InterfaceTreeTestHelper.testDelete(result.tree, radixData);
    //     }
    // });
});