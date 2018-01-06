var assert = require('assert')
var BigNumber = require('bignumber.js');

import InterfaceRadixTree from 'common/trees/radix-tree/Interface-Radix-Tree'
import IntefaceMerkleRadixTree from 'common/trees/radix-tree/merkle-tree/Interface-Merkle-Radix-Tree'

class InterfaceAccountantRadixTreeTestHelper {

    constructor (className){
        this.className = className;
    }

    testAdd (accountantData, accountantTree) {

        if ( accountantTree === undefined || accountantTree === null)  accountantTree = new this.className();

        accountantData.forEach((data, index) => {

            accountantTree.add( new Buffer(data.text, "ascii"), {
                text: data.text,
                balances: data.value.toString()
            });

            //console.log("accountant text", data.value.toString())
            //accountantTree.printLevelSearch();
            assert(accountantTree.validateRoot() === true, "validate Tree was not passed at " + index + " because " + JSON.stringify(data));
            assert(accountantTree.validateParentsAndChildrenEdges() === true, "Accountant Tree Parents and Children Edges don't match");

            assert(accountantTree.search(new Buffer(data.text, "ascii")).result === true, "Accountant Tree couldn't find " + index + "   " + data + " although it was added");

            accountantData.forEach((data2, index2) => {

                let str2 = data2.text;

                let mustFind = false;
                if (index2 <= index)
                    mustFind = true;

                assert(accountantTree.search(new Buffer(str2, "ascii")).result === mustFind, "Accountant Tree couldn't find or not find " + str2 + " although it was added successfully");

            });""
        });

        let result = accountantTree.levelSearch();

        let sum = new BigNumber(0);
        for (let i = 0; i < accountantData.length; i++)
            sum = sum.plus(new BigNumber(accountantData[i].value.toString()));

        // console.log("Accountant Tree sums");
        // console.log(sum);
        // console.log(result[0][0].sum);

        assert(accountantTree.root.sum.equals(sum), "Accountant Tree Root Node Amount is different (it was not propagated up) " + result[0][0].sum + "       " + sum + "       diff: " + accountantTree.root.sum.minus(sum).toString());

        //accountantTree.printLevelSearch();

        return {tree: accountantTree, levels: result};

    };

    testDelete (accountantTree, accountantData, showDebug) {

        accountantData.forEach((data, index) => {

            let str = data.text;

            accountantTree.delete(new Buffer(str, "ascii"));

            if (showDebug) {
                console.log("deleted", str);
                accountantTree.printLevelSearch();
            }

            assert(accountantTree.validateRoot() === true, "Accountant after " + str + " is not Valid");
            assert(accountantTree.validateParentsAndChildrenEdges() === true, "Accountant Tree Parent and Children Edges don't match");

            assert(!accountantTree.search(new Buffer(str, "ascii")).result, "Radix Tree2 couldn't find " + index + "   " + str + " although it was added");

            accountantData.forEach((data2, index2) => {

                let str2 = data2.text;

                let mustFind = true;
                if (index2 <= index)
                    mustFind = false;

                if (accountantTree.search( new Buffer(str2, "ascii")).result !== mustFind) {
                    console.log("accountant tree didn't work for deleting ", index, " str ", str, "and finding ", str2)
                    accountantTree.printLevelSearch();
                }

                assert(accountantTree.search( new Buffer(str2, "ascii")).result === mustFind, "Accountant Tree couldn't find or not find '" + str2 + "' although it was added successfully");

            });

        });

        let result = accountantTree.levelSearch();

        assert(result.length === 1, "result is not 1 level");
        assert(result[0].length === 1, "root is not empty");

    };

}

export default InterfaceAccountantRadixTreeTestHelper;