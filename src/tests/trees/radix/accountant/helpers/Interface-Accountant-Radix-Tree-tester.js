var assert = require('assert')
import TestsHelper from 'tests/Tests.helper'

export default (InterfaceAccountantRadixTreeHelper) => {

    let accountantTree = null;
    let accountantData = null;

    it('creating &deleting Accountant Radix tree - romanus example', () => {

        //Based on this tutorial https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/Patricia_trie.svg/350px-Patricia_trie.svg.png
        accountantData = [{text: "romane", value: 5}, {text: "romanus",value: 2}, {text: "romulus",value: 3}, {text: "rubens",value: 16}, {text: "ruber",value: 6}, {text: "rubicon",value: 8}, {text: "rubicundus",value: 9}];

        //let randomize accountantData values
        for (let i = 0; i < accountantData.length; i++)
            accountantData[i].value = TestsHelper.makeRandomNumber();

        let result = InterfaceAccountantRadixTreeHelper.testAdd( accountantData );

        assert(result.levels.length === 5, "Accountant Tree has to many levels");
        assert(result.levels[0].length === 1, "Accountant Tree Level 0 has different nodes");
        assert(result.levels[1].length === 1, "Accountant Tree Level 1 has different nodes");
        assert(result.levels[2].length === 2, "Accountant Tree Level 2 has different nodes");
        assert(result.levels[3].length === 4, "Accountant Tree Level 3 has different nodes");
        assert(result.levels[4].length === 6, "Accountant Tree Level 4 has different nodes");

        InterfaceAccountantRadixTreeHelper.testDelete(result.tree, accountantData);
    });

    it('creating & deleting Accountant Radix tree - slowly permutations example', () => {

        let testStrings = ["test", "toaster", "toasting", "slow", "slowly"];
        accountantData = TestsHelper.makeSetIdAndNumber(testStrings.length, false, 10000);

        let permutations = TestsHelper.makePermutations(testStrings);
        /*For each permutation*/
        for (let i = 0, len = permutations.length; i < len; ++i) {

            //let randomize accountantData values
            for (let j = 0; j < permutations[i].length; j++) {
                accountantData[j].value = TestsHelper.makeRandomNumber();
                accountantData[j].text = permutations[i][j];
            }

            let result = InterfaceAccountantRadixTreeHelper.testAdd(accountantData);

            assert(result.levels.length === 4, "Radix Tree has to many levels" + permutations[i]);
            assert(result.levels[0].length === 1, "Radix Tree Level 0 has different nodes");
            assert(result.levels[1].length === 2, "Radix Tree Level 1 has different nodes");
            assert(result.levels[2].length === 3, "Radix Tree Level 2 has different nodes");
            assert(result.levels[3].length === 2, "Radix Tree Level 3 has different nodes");

            InterfaceAccountantRadixTreeHelper.testDelete(result.tree, accountantData);
        }
    });

    it('creating & deleting Accountant Radix tree 2 Oprea', () => {

        accountantData = [{text: "test", value: 100}, {text: "toaster",value: 2}, {text: "toasting",value: 3}, {text: "slow",value: 16}, {text: "slowly",value: 6}];

        //let randomize accountantData values
        for (let i = 0; i < accountantData.length; i++)
            accountantData[i].value = TestsHelper.makeRandomNumber();

        let result = InterfaceAccountantRadixTreeHelper.testAdd(accountantData);

        assert(result.levels.length === 4, "Radix Tree has to many levels");
        assert(result.levels[0].length === 1, "Radix Tree Level 0 has different nodes");
        assert(result.levels[1].length === 2, "Radix Tree Level 1 has different nodes");
        assert(result.levels[2].length === 3, "Radix Tree Level 2 has different nodes");
        assert(result.levels[3].length === 2, "Radix Tree Level 3 has different nodes");

        InterfaceAccountantRadixTreeHelper.testDelete(result.tree, accountantData);

    });


    it('creating & deleting Accountant Radix tree - generalized integer', () => {

        accountantData = TestsHelper.makeSetIdAndNumber(100, true, 10000);

        let result = InterfaceAccountantRadixTreeHelper.testAdd(accountantData);
        InterfaceAccountantRadixTreeHelper.testDelete(result.tree, accountantData);

    });

    it('creating & deleting Accountant Radix tree - generalized floats', () => {

        accountantData = TestsHelper.makeSetIdAndNumber(100, false, 10000);

        let result = InterfaceAccountantRadixTreeHelper.testAdd(accountantData);
        InterfaceAccountantRadixTreeHelper.testDelete(result.tree, accountantData);

    });



    it('creating & deleting Accountant Radix tree - generalized different lengths', () => {

        accountantData = TestsHelper.makeSetVariableIdAndNumber(100, false, 10000);

        let result = InterfaceAccountantRadixTreeHelper.testAdd(accountantData);
        InterfaceAccountantRadixTreeHelper.testDelete(result.tree, accountantData);
    });

    it('creating & deleting Accountant Radix tree - generalized different with small lengths', () => {

        accountantData = TestsHelper.makeSetVariableIdAndNumber(100, false, 10000, 2 );


        let result = InterfaceAccountantRadixTreeHelper.testAdd(accountantData);
        InterfaceAccountantRadixTreeHelper.testDelete(result.tree, accountantData);
    });

    it('creating & deleting Accountant Radix tree -small test', () => {

        //accountantData = [{text: "name", value: 5}, {text: "dob",value: 2}, {text: "spouse",value: 3}, {text: "nameads",value: 16}, {text: "namsse",value: 6}, {text: "dofab",value: 8}, {text: "spoudse",value: 9}, {text: "occupdsation", value:15}, {text: "dozzzb", value:20}, {text: "spouszze", value: 30}, {text: "occupatdfion", value:40}, {text: "dssob", value:50}, {text: "spossuse", value:60}, {text: "occupssation", value:80}];
        accountantData = [{text: "ara", value: 5}, {text: "aba",value: 2}, {text: "a",value: 3}];

        let result = InterfaceAccountantRadixTreeHelper.testAdd(accountantData);
        InterfaceAccountantRadixTreeHelper.testDelete(result.tree, accountantData);
    });

    it('creating & deleting Accountant Radix tree - ETHEREUM test', () => {

        accountantData = [{text: "name", value: 5}, {text: "dob",value: 2}, {text: "spouse",value: 3}, {text: "nameads",value: 16}, {text: "namsse",value: 6}, {text: "dofab",value: 8}, {text: "spoudse",value: 9}, {text: "occupdsation", value:15}, {text: "dozzzb", value:20}, {text: "spouszze", value: 30}, {text: "occupatdfion", value:40}, {text: "dssob", value:50}, {text: "spossuse", value:60}, {text: "occupssation", value:80}];

        let result = InterfaceAccountantRadixTreeHelper.testAdd(accountantData);
        InterfaceAccountantRadixTreeHelper.testDelete(result.tree, accountantData);
    });

    it('creating & deleting Accountant Radix tree - generalized permutations of different with small lengths', () => {

        accountantData = TestsHelper.makeSetIdAndNumber(6, false, 10000);
        let testStrings = [];
        for (let i = 0; i < accountantData.length; ++i)
            testStrings[i] = accountantData[i].text;

        let permutations = TestsHelper.makePermutations(testStrings);
        /*For each permutation*/

        for (let i = 0, len = permutations.length; i < len; ++i) {

            //let randomize accountantData values
            for (let j = 0; j < permutations[i].length; j++) {
                accountantData[j].value = TestsHelper.makeRandomNumber();
                accountantData[j].text = permutations[i][j];
            }

            let result = InterfaceAccountantRadixTreeHelper.testAdd(accountantData);
            InterfaceAccountantRadixTreeHelper.testDelete(result.tree, accountantData);
        }
    });

}