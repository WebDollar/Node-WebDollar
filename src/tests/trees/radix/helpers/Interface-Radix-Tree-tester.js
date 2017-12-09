var assert = require('assert')
import WebDollarCryptoData from 'common/crypto/Webdollar-Crypto-Data'
import TestsHelper from 'tests/Tests.helper'

export default (InterfaceRadixTreeHelper, simplified)=>{

    let radixTree = null;
    let radixData = null;
    let result = null;

    it("creating & deleting radix tree romane", () => {

        //Based on this tutorial https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/Patricia_trie.svg/350px-Patricia_trie.svg.png
        radixData = ["romane", "romanus", "romulus", "rubens", "ruber", "rubicon", "rubicundus"];

        result = InterfaceRadixTreeHelper.testAdd(radixData);

        assert(result.levels.length === 5, "Radix Tree has to many levels-");
        assert(result.levels[0].length === 1, "Radix Tree Level 0 has different nodes");
        assert(result.levels[1].length === 1, "Radix Tree Level 1 has different nodes");
        assert(result.levels[2].length === 2, "Radix Tree Level 2 has different nodes");
        assert(result.levels[3].length === 4, "Radix Tree Level 3 has different nodes");
        assert(result.levels[4].length === 6, "Radix Tree Level 4 has different nodes");

        InterfaceRadixTreeHelper.testDelete(result.tree, radixData);

    });

    it("search radix tree romane", () => {

        //Based on this tutorial https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/Patricia_trie.svg/350px-Patricia_trie.svg.png
        radixData = ["romane", "romanus", "romulus", "rubens", "ruber", "rubicon", "rubicundus"];

        radixTree = InterfaceRadixTreeHelper.testAdd(radixData).tree;

        InterfaceRadixTreeHelper.testSearch(radixData, radixTree, true);
        InterfaceRadixTreeHelper.testSearch(["rubicundusxx", "ruberr"], radixTree, false);
    });

    it("creating & deleting radix tree 2 Oprea's bug report", () => {

        //Based on https://en.wikipedia.org/wiki/Radix_tree#/media/File:An_example_of_how_to_find_a_string_in_a_Patricia_trie.png
        radixData = ["test", "toaster", "toasting", "slow", "slowly"];

        result = InterfaceRadixTreeHelper.testAdd(radixData);

        assert(result.levels.length === 4, "Radix Tree has to many levels");
        assert(result.levels[0].length === 1, "Radix Tree Level 0 has different nodes");
        assert(result.levels[1].length === 2, "Radix Tree Level 1 has different nodes");
        assert(result.levels[2].length === 3, "Radix Tree Level 2 has different nodes");
        assert(result.levels[3].length === 2, "Radix Tree Level 3 has different nodes");

        InterfaceRadixTreeHelper.testDelete(result.tree, radixData);

    });

    it("search radix tree 2 Oprea", () => {

        radixData = ["test", "toaster", "toasting", "slow", "slowly"];

        radixTree = InterfaceRadixTreeHelper.testAdd(radixData).tree;

        InterfaceRadixTreeHelper.testSearch(["slo", "toastingg"], radixTree, false);
        InterfaceRadixTreeHelper.testDelete(radixTree, radixData);
    })

    it("creating & deleting radix tree 3 - generalized test", () => {

        radixData = TestsHelper.makeIds( simplified ? 100 : 200, 100);
        result = InterfaceRadixTreeHelper.testAdd(radixData);

        InterfaceRadixTreeHelper.testDelete(result.tree, radixData);
    });

    it("creating & deleting radix tree 3 - test different lengths tests", () => {

        //radixTestingArray = [ "slowly", "slowby", "slow" ];
        //radixTestingArray = [ "sl", "slowly", "slow" ];
        radixData = ["slowly", "slowlb", "slom", "slow"];

        result = InterfaceRadixTreeHelper.testAdd(radixData);

        InterfaceRadixTreeHelper.testDelete(result.tree, radixData);
    });

    it("creating & deleting radix tree 3 - generalized test different lengths", () => {

        //radixTestingArray = ["a","b","c","bd", "be"]
        radixData = TestsHelper.makeIds( simplified ? 100 : 200, 100, true);

        result = InterfaceRadixTreeHelper.testAdd(radixData);

        InterfaceRadixTreeHelper.testDelete(result.tree, radixData);
    });

    it("creating & deleting radix tree 4 - generalized permutation backtracking test", () => {
        //For each permutation create a radix tree, then delete all the added words
        let testStrings = TestsHelper.makeIds( simplified ? 6 : 7, 32, true);
        let permutations = TestsHelper.makePermutations(testStrings);

        //For each permutation
        for (let i = 0, len = permutations.length; i < len; ++i) {
            radixData = permutations[i];

            result = InterfaceRadixTreeHelper.testAdd(radixData);

            InterfaceRadixTreeHelper.testDelete(result.tree, radixData);
        }
    });

}