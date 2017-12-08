var assert = require('assert')

import TestsHelper from 'tests/Tests.helper'

import InterfaceMerkleRadixTree from 'common/trees/radix-tree/merkle-tree/Interface-Merkle-Radix-Tree'
import InterfaceTreeTestHelperClass from '../helpers/Interface-Tree.test.helper'

let InterfaceTreeTestHelper = new InterfaceTreeTestHelperClass(InterfaceMerkleRadixTree);

describe("Interface Radix Tree", () => {

    let radixTree = null;
    let radixData = null;
    let result = null;

    it("creating & deleting radix tree 3 - generalized test different lengths", () => {

        radixData = TestsHelper.makeIds(200, 100, true);

        result = InterfaceTreeTestHelper.testAdd(radixData);

        InterfaceTreeTestHelper.testDelete(result.tree, radixData);
    });

    it("creating & deleting radix tree 4 - generalized permutation backtracking test", () => {

        //For each permutation create a radix tree, then delete all the added words
        let testStrings = TestsHelper.makeIds(7, 32, true);
        let permutations = TestsHelper.makePermutations(testStrings);

        //For each permutation
        for (let i = 0, len = permutations.length; i < len; ++i) {
            radixData = [permutations[i]];

            result = InterfaceTreeTestHelper.testAdd(radixData);

            InterfaceTreeTestHelper.testDelete(result.tree, radixData);
        }
    });
});