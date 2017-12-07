var BigNumber = require('bignumber.js');

var assert = require('assert')

import InterfaceRadixTree from 'common/trees/radix-tree/Interface-Radix-Tree'
import InterfaceAccountantRadixTree from 'common/trees/radix-tree/account-tree/Interface-Accountant-Radix-Tree'
import WebDollarCryptoData from 'common/crypto/Webdollar-Crypto-Data'
import TestsHelper from 'tests/Tests.helper'

describe('Interface Accountant Radix Tree', () => {

    let accountantTree = null;

    //Based on this tutorial https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/Patricia_trie.svg/350px-Patricia_trie.svg.png
    let accountantData = [{text: "romane", value: 5}, {text: "romanus",value: 2}, {text: "romulus",value: 3}, {text: "rubens",value: 16}, {text: "ruber",value: 6}, {text: "rubicon",value: 8}, {text: "rubicundus",value: 9}];

    //let randomize accountantData values
    for (let i = 0; i < accountantData.length; i++)
        accountantData[i].value = TestsHelper.makeRandomNumber();

    it('creating Accountant Radix tree', () => {

        accountantTree = new InterfaceAccountantRadixTree();

        accountantData.forEach((data, index) => {
            accountantTree.add(new WebDollarCryptoData(data.text, "ascii"), {
                text: data.text,
                balance: data.value.toString()
            } );

            console.log("accountant text", data.value.toString())
            accountantTree.printLevelSearch();
            assert(accountantTree.validateRoot() === true, "validate Tree was not passed at " + index + " because " + JSON.stringify(data));
        });

        let result = accountantTree.levelSearch();

        assert(result.length === 5, "Accountant Tree has to many levels");
        assert(result[0].length === 1, "Accountant Tree Level 0 has different nodes");
        assert(result[1].length === 1, "Accountant Tree Level 1 has different nodes");
        assert(result[2].length === 2, "Accountant Tree Level 2 has different nodes");
        assert(result[3].length === 4, "Accountant Tree Level 3 has different nodes");
        assert(result[4].length === 6, "Accountant Tree Level 4 has different nodes");

        let sum = new BigNumber(0);
        for (let i = 0; i < accountantData.length; i++)
            sum = sum.plus(new BigNumber(accountantData[i].value.toString()));

        console.log("Accountant Tree sums");
        console.log(sum);
        console.log(result[0][0].sum);

        accountantTree.printLevelSearch();

        assert(accountantTree.root.sum.equals(sum), "Accountant Tree Root Node Amount is different (it was not propagated up) " + result[0][0].sum + "       " + sum + "       diff: " + accountantTree.root.sum.minus(sum).toString());

        accountantTree.printLevelSearch();
    });
    
    it('creating Accountant Radix tree 2 Oprea', () => {
        
        accountantData = [{text: "test", value: 100}, {text: "toaster",value: 2}, {text: "toasting",value: 3}, {text: "slow",value: 16}, {text: "slowly",value: 6}];
        accountantTree = new InterfaceAccountantRadixTree();

        accountantData.forEach((data, index) => {
            accountantTree.add(new WebDollarCryptoData(data.text, "ascii"), {
                text: data.text,
                balance: data.value.toString()
            });
            console.log("Cosmin 555");
            accountantTree.printLevelSearch();
            assert(accountantTree.validateRoot() === true, "validate Tree was not passed at " + index + " because " + JSON.stringify(data));

        });

        let result = accountantTree.levelSearch();

        assert(result.length === 4, "Radix Tree has to many levels");
        assert(result[0].length === 1, "Radix Tree Level 0 has different nodes");
        assert(result[1].length === 2, "Radix Tree Level 1 has different nodes");
        assert(result[2].length === 3, "Radix Tree Level 2 has different nodes");
        assert(result[3].length === 2, "Radix Tree Level 3 has different nodes");

        let sum = new BigNumber(0);
        for (let i = 0; i < accountantData.length; i++)
            sum = sum.plus(new BigNumber(accountantData[i].value.toString()));

        console.log("Accountant Tree sums");
        console.log(sum);
        console.log(result[0][0].sum);

        accountantTree.printLevelSearch();

        assert(accountantTree.root.sum.equals(sum), "Accountant Tree Root Node Amount is different (it was not propagated up) " + result[0][0].sum + "       " + sum + "       diff: " + accountantTree.root.sum.minus(sum).toString());

        accountantTree.printLevelSearch();
    });


    it('creating Accountant Radix tree - generalized integer', () => {

        accountantTree = new InterfaceAccountantRadixTree();
        accountantData = TestsHelper.makeSetIdAndNumber(100, true, 10000);

        accountantData.forEach((data, index) => {
            accountantTree.add(new WebDollarCryptoData(data.text, "ascii"), {
                text: data.text,
                balance: data.value.toString()
            });

            assert(accountantTree.validateRoot() === true, "validate Tree was not passed at " + index + " because " + JSON.stringify(data));
        });

        let sum = new BigNumber(0);
        for (let i = 0; i < accountantData.length; i++)
            sum = sum.plus(new BigNumber(accountantData[i].value.toString()));

        console.log("Accountant Tree sums");
        let str = "";
        for (let i = 0; i < accountantData.length; i++)
            str += accountantData[i].value.toString() + " + ";

        console.log("Sums str", str);
        console.log(sum);
        console.log(accountantTree.root.sum);

        accountantTree.printLevelSearch();

        assert(accountantTree.root.sum.equals(sum), "Accountant Tree Root Node Amount is different (it was not propagated up) " + accountantTree.root.sum + "       " + sum + "       diff: " + accountantTree.root.sum.minus(sum).toString());
    });

    it('creating Accountant Radix tree - generalized', () => {

        accountantTree = new InterfaceAccountantRadixTree();
        accountantData = TestsHelper.makeSetIdAndNumber(100, false, 10000);

        for (let i = 0; i < accountantData.length; i++)
            accountantData[i].value = i;

        accountantData.forEach((data, index) => {
            accountantTree.add(new WebDollarCryptoData(data.text, "ascii"), {
                text: data.text,
                balance: data.value.toString()
            });

            assert(accountantTree.validateRoot() === true, "validate Tree was not passed at " + index + " because " + JSON.stringify(data));
        });

        let sum = new BigNumber(0);
        for (let i = 0; i < accountantData.length; i++)
            sum = sum.plus(new BigNumber(accountantData[i].value.toString()));

        console.log("Accountant Tree sums");
        let str = "";
        for (let i = 0; i < accountantData.length; i++)
            str += accountantData[i].value.toString() + " + ";

        console.log("Sums str", str);
        console.log(sum);
        console.log(accountantTree.root.sum);

        assert(accountantTree.root.sum.equals(sum), "Accountant Tree Root Node Amount is different (it was not propagated up) " + accountantTree.root.sum + "       " + sum + "       diff: " + accountantTree.root.sum.minus(sum).toString());
    });
});