var BigNumber = require('bignumber.js');

var assert = require('assert')

import InterfaceRadixTree from 'common/trees/radix-tree/Interface-Radix-Tree'
import InterfaceAccountantRadixTree from 'common/trees/radix-tree/account-tree/Interface-Accountant-Radix-Tree'
import WebDollarCryptoData from 'common/crypto/Webdollar-Crypto-Data'
import TestsHelper from 'tests/Tests.helper'

let testAddRadix = (accountantData, accountantTree)=>{

    if (typeof accountantTree === 'undefined' || accountantTree === null)  accountantTree = new InterfaceAccountantRadixTree();

    accountantData.forEach((data, index) => {
        accountantTree.add(new WebDollarCryptoData(data.text, "ascii"), {
            text: data.text,
            balance: data.value.toString()
        } );

        // console.log("accountant text", data.value.toString())
        // accountantTree.printLevelSearch();
        assert(accountantTree.validateRoot() === true, "validate Tree was not passed at " + index + " because " + JSON.stringify(data));
        assert(accountantTree.validateParentsAndChildrenEdges() === true, "Accountant Tree Parents and Children Edges don't match");

        assert(accountantTree.search(new WebDollarCryptoData(data.text, "ascii")).result === true, "Accountant Tree couldn't find " + index + "   " + data + " although it was added");

        accountantData.forEach((data2, index2) => {

            let str2 = data2.text;

            let mustFind = false;
            if (index2 <= index)
                mustFind = true;

            assert(accountantTree.search(new WebDollarCryptoData(str2, "ascii")).result === mustFind, "Accountant Tree couldn't find or not find " + str2 + " although it was added successfully");

        });
    });

    let result = accountantTree.levelSearch();

    let sum = new BigNumber(0);
    for (let i = 0; i < accountantData.length; i++)
        sum = sum.plus(new BigNumber(accountantData[i].value.toString()));

    console.log("Accountant Tree sums");
    console.log(sum);
    console.log(result[0][0].sum);

    assert(accountantTree.root.sum.equals(sum), "Accountant Tree Root Node Amount is different (it was not propagated up) " + result[0][0].sum + "       " + sum + "       diff: " + accountantTree.root.sum.minus(sum).toString());

    //accountantTree.printLevelSearch();

    return {tree: accountantTree, levels: result};

};

let testRadixDelete = (accountantTree, accountantData) => {

    accountantData.forEach((data, index) => {

        let str = data.text;

        accountantTree.delete(new WebDollarCryptoData(str, "ascii"));

        assert(accountantTree.validateRoot() === true, "Accountant after " + str + " is not Valid");
        assert(accountantTree.validateParentsAndChildrenEdges() === true, "Accountant Tree Parent and Children Edges don't match");

        assert(!accountantTree.search(new WebDollarCryptoData(str, "ascii")).result, "Radix Tree2 couldn't find " + index + "   " + str + " although it was added");

        accountantData.forEach((data2, index2) => {

            let str2 = data2.text;

            let mustFind = true;
            if (index2 <= index)
                mustFind = false;

            if (accountantTree.search(new WebDollarCryptoData(str2, "ascii")).result !== mustFind) {
                console.log("accountant tree didn't work for deleting ", index, " str ", str, "and finding ", str2)
                accountantTree.printLevelSearch();
            }

            assert(accountantTree.search(new WebDollarCryptoData(str2, "ascii")).result === mustFind, "Accountant Tree couldn't find or not find '" + str2 + "' although it was added successfully");

        });

    });

    let result = accountantTree.levelSearch();

    assert(result.length === 1, "result is not 1 level");
    assert(result[0].length === 1, "root is not empty");

};

describe('Interface Accountant Radix Tree', () => {

    let accountantTree = null;
    let accountantData = null;

    it('creating Accountant Radix tree - romanus example', () => {

        //Based on this tutorial https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/Patricia_trie.svg/350px-Patricia_trie.svg.png
        accountantData = [{text: "romane", value: 5}, {text: "romanus",value: 2}, {text: "romulus",value: 3}, {text: "rubens",value: 16}, {text: "ruber",value: 6}, {text: "rubicon",value: 8}, {text: "rubicundus",value: 9}];

        //let randomize accountantData values
        for (let i = 0; i < accountantData.length; i++)
            accountantData[i].value = TestsHelper.makeRandomNumber();

        let result = testAddRadix( accountantData );

        assert(result.levels.length === 5, "Accountant Tree has to many levels");
        assert(result.levels[0].length === 1, "Accountant Tree Level 0 has different nodes");
        assert(result.levels[1].length === 1, "Accountant Tree Level 1 has different nodes");
        assert(result.levels[2].length === 2, "Accountant Tree Level 2 has different nodes");
        assert(result.levels[3].length === 4, "Accountant Tree Level 3 has different nodes");
        assert(result.levels[4].length === 6, "Accountant Tree Level 4 has different nodes");

        testRadixDelete(result.tree, accountantData);
    });
    
    it('creating & deleting Accountant Radix tree 2 Oprea', () => {
        
        accountantData = [{text: "test", value: 100}, {text: "toaster",value: 2}, {text: "toasting",value: 3}, {text: "slow",value: 16}, {text: "slowly",value: 6}];

        //let randomize accountantData values
        for (let i = 0; i < accountantData.length; i++)
            accountantData[i].value = TestsHelper.makeRandomNumber();

        let result = testAddRadix(accountantData);

        assert(result.levels.length === 4, "Radix Tree has to many levels");
        assert(result.levels[0].length === 1, "Radix Tree Level 0 has different nodes");
        assert(result.levels[1].length === 2, "Radix Tree Level 1 has different nodes");
        assert(result.levels[2].length === 3, "Radix Tree Level 2 has different nodes");
        assert(result.levels[3].length === 2, "Radix Tree Level 3 has different nodes");

        testRadixDelete(result.tree, accountantData);

    });


    it('creating & deleting Accountant Radix tree - generalized integer', () => {

        accountantData = TestsHelper.makeSetIdAndNumber(100, true, 10000);

        let result = testAddRadix(accountantData);
        testRadixDelete(result.tree, accountantData);

    });

    it('creating & deleting Accountant Radix tree - generalized floats', () => {

        accountantData = TestsHelper.makeSetIdAndNumber(100, false, 10000);

        let result = testAddRadix(accountantData);
        testRadixDelete(result.tree, accountantData);

    });



    it('creating & deleting Accountant Radix tree - generalized different lengths', () => {

        accountantData = TestsHelper.makeSetVariableIdAndNumber(100, false, 10000);

        let result = testAddRadix(accountantData);
        testRadixDelete(result.tree, accountantData);
    });

});