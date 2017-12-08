var assert = require('assert')

import TestsHelper from 'tests/Tests.helper'
import InterfaceRadixTree from 'common/trees/radix-tree/Interface-Radix-Tree'
import WebDollarCryptoData from 'common/crypto/Webdollar-Crypto-Data'

let testAddRadix = (radixData, radixTree)=>{

    if (typeof radixTree === 'undefined' || radixTree === null)  radixTree = new InterfaceRadixTree();

    radixData.forEach((str) => {
        radixTree.add(new WebDollarCryptoData(str, "ascii"), {
            address: str
        });
        assert(radixTree.validateRoot() === true, "Radix Tree after " + str + " is not Valid");
        assert(radixTree.validateParentsAndChildrenEdges() === true, "Radix Parents and Children Edges don't match");
    });

    radixData.forEach((str) => {
        let result = radixTree.search(new WebDollarCryptoData(str, "ascii"));
        assert(result.result === true, "result " + str + " was not found");
    });

    let result = radixTree.levelSearch();
    return {tree: radixTree, levels: result};

};

let testSearchRadix = (radixData, radixTree, needToBeFound)=>{

    radixData.forEach((str) => {
            let result = radixTree.search(new WebDollarCryptoData(str, "ascii"));
            assert(result.result === needToBeFound, "result " + str + " was not found");
    });
    
};

let testRadixDelete = (radixTree, radixData) => {

    radixData.forEach((str, index) => {

        let deleteResult = radixTree.delete(new WebDollarCryptoData(str, "ascii"));
        assert(deleteResult === true, "delete " + str + " didn't work");

        assert(radixTree.validateRoot() === true, "Radix Tree deleted after " + str + " is not Valid");
        assert(radixTree.validateParentsAndChildrenEdges() === true, "Radix Parents and Children Edges don't match");

        let searchResult = radixTree.search(new WebDollarCryptoData(str, "ascii"));
        assert(!searchResult.result, "result " + str + " was actually found...");

        // the radix sort still, should detect all remaining strings
        for (let j = index + 1; j < radixData.length; j++) {
            let searchResult = radixTree.search(new WebDollarCryptoData(radixData[j], "ascii"));
            assert(searchResult.result === true, "result " + str + " was not found after " + str + " was deleted...");
        }

    });

    let result = radixTree.levelSearch();

    assert(result.length === 1, "result is not 1 level");
    assert(result[0].length === 1, "root is not empty");

};

describe("Interface Radix Tree", () => {

    let radixTree = null;
    let radixData = null;
    let result = null;
    
    it("creating & deleting radix tree romane", () => {

        //Based on this tutorial https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/Patricia_trie.svg/350px-Patricia_trie.svg.png
        radixData = ["romane", "romanus", "romulus", "rubens", "ruber", "rubicon", "rubicundus"];
        
        result = testAddRadix(radixData);

        assert(result.levels.length === 5, "Radix Tree has to many levels-");
        assert(result.levels[0].length === 1, "Radix Tree Level 0 has different nodes");
        assert(result.levels[1].length === 1, "Radix Tree Level 1 has different nodes");
        assert(result.levels[2].length === 2, "Radix Tree Level 2 has different nodes");
        assert(result.levels[3].length === 4, "Radix Tree Level 3 has different nodes");
        assert(result.levels[4].length === 6, "Radix Tree Level 4 has different nodes");

        testRadixDelete(result.tree, radixData);

    });

    it("search radix tree romane", () => {

        //Based on this tutorial https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/Patricia_trie.svg/350px-Patricia_trie.svg.png
        radixData = ["romane", "romanus", "romulus", "rubens", "ruber", "rubicon", "rubicundus"];
        
        radixTree = testAddRadix(radixData).tree;

        testSearchRadix(radixData, radixTree, true);
        testSearchRadix(["rubicundusxx", "ruberr"], radixTree, false);
    });

    it("creating & deleting radix tree 2 Oprea's bug report", () => {

        //Based on https://en.wikipedia.org/wiki/Radix_tree#/media/File:An_example_of_how_to_find_a_string_in_a_Patricia_trie.png
        radixData = ["test", "toaster", "toasting", "slow", "slowly"];
        
        result = testAddRadix(radixData);

        assert(result.levels.length === 4, "Radix Tree has to many levels");
        assert(result.levels[0].length === 1, "Radix Tree Level 0 has different nodes");
        assert(result.levels[1].length === 2, "Radix Tree Level 1 has different nodes");
        assert(result.levels[2].length === 3, "Radix Tree Level 2 has different nodes");
        assert(result.levels[3].length === 2, "Radix Tree Level 3 has different nodes");

        testRadixDelete(result.tree, radixData);

    });

    it("search radix tree 2 Oprea", () => {
       
        radixData = ["test", "toaster", "toasting", "slow", "slowly"];
        
        radixTree = testAddRadix(radixData).tree;

        testSearchRadix(["slo", "toastingg"], radixTree, false);
    })

    it("creating & deleting radix tree 3 - generalized test", () => {

        radixData = TestsHelper.makeIds(200, 100);
        result = testAddRadix(radixData);

        testRadixDelete(result.tree, radixData);
    });

    it("creating & deleting radix tree 3 - test different lengths tests", () => {

        //radixTestingArray = [ "slowly", "slowby", "slow" ];
        //radixTestingArray = [ "sl", "slowly", "slow" ];
        radixData = ["slowly", "slowlb", "slom", "slow"];
        
        result = testAddRadix(radixData);

        testRadixDelete(result.tree, radixData);
    });

    it("creating & deleting radix tree 3 - generalized test different lengths", () => {

        //radixTestingArray = ["a","b","c","bd", "be"]
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