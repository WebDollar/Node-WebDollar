var assert = require('assert')

import TestsHelper from 'tests/Tests.helper'
import InterfaceMerkleRadixTree from 'common/trees/radix-tree/merkle-tree/Interface-Merkle-Radix-Tree'
import WebDollarCryptoData from 'common/crypto/Webdollar-Crypto-Data'

let testAddMerkleRadix = (radixData, merkleTree)=>{

    if (typeof merkleTree === 'undefined' || merkleTree === null)  merkleTree = new InterfaceMerkleRadixTree();

    radixData.forEach((str) => {
        merkleTree.add(new WebDollarCryptoData(str, "ascii"), {
            address: str
        });
        assert(merkleTree.validateRoot() === true, "Radix Tree after " + str + " is not Valid");
        assert(merkleTree.validateParentsAndChildrenEdges() === true, "Radix Parents and Children Edges don't match");
    });

    radixData.forEach((str) => {
        let result = merkleTree.search(new WebDollarCryptoData(str, "ascii"));
        assert(result.result === true, "result " + str + " was not found");
    });

    let result = merkleTree.levelSearch();
    return {tree: merkleTree, levels: result};

};

let testSearchMerkleRadix = (radixData, merkleTree, needToBeFound)=>{

    radixData.forEach((str) => {

        let result = merkleTree.search(new WebDollarCryptoData(str, "ascii"));
        assert(result.result === needToBeFound, "result " + str + " was not found");

    });

};

let testMerkleRadixDelete = (merkleTree, radixData) => {

    radixData.forEach((str, index) => {

        let deleteResult = merkleTree.delete(new WebDollarCryptoData(str, "ascii"));
        assert(deleteResult === true, "delete " + str + " didn't work");

        assert(merkleTree.validateRoot() === true, "Radix Tree deleted after " + str + " is not Valid");
        assert(merkleTree.validateParentsAndChildrenEdges() === true, "Radix Parents and Children Edges don't match");

        let searchResult = merkleTree.search(new WebDollarCryptoData(str, "ascii"));
        assert(!searchResult.result, "result " + str + " was actually found...");

        // the radix sort still, should detect all remaining strings
        for (let j = index + 1; j < radixData.length; j++) {
            let searchResult = merkleTree.search(new WebDollarCryptoData(radixData[j], "ascii"));
            assert(searchResult.result === true, "result " + str + " was not found after " + str + " was deleted...");
        }

    });

    let result = merkleTree.levelSearch();

    assert(result.length === 1, "result is not 1 level");
    assert(result[0].length === 1, "root is not empty");

};

describe("Interface Radix Tree", () => {

    let radixTree = null;
    let radixData = null;
    let result = null;

    it("creating & deleting radix tree 3 - generalized test different lengths", () => {

        radixData = TestsHelper.makeIds(200, 100, true);

        result = testAddRadix(radixData);

        testRadixDelete(result.tree, radixData);
    });

    it("creating & deleting radix tree 4 - generalized permutation backtracking test", () => {

        //For each permutation create a radix tree, then delete all the added words
        let testStrings = TestsHelper.makeIds(7, 32, true);
        let permutations = TestsHelper.makePermutations(testStrings);

        //For each permutation
        for (let i = 0, len = permutations.length; i < len; ++i) {
            radixData = [permutations[i]];

            result = testAddRadix(radixData);

            testRadixDelete(result.tree, radixData);
        }
    });
});