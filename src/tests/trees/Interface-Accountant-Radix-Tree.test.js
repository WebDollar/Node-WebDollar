
var assert = require('assert')

import InterfaceRadixTree from 'common/trees/radix-tree/Interface-Radix-Tree'
import InterfaceAccountantRadixTree from 'common/trees/radix-tree/account-tree/Interface-Accountant-Radix-Tree'
import WebDollarCryptoData from 'common/crypto/Webdollar-Crypto-Data'

describe('Interface Accountant Radix Tree', () => {

    let accountantTree = null;

    //Based on this tutorial https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/Patricia_trie.svg/350px-Patricia_trie.svg.png
    let accountantData = [ {text: "romane", value: 5}, {text: "romanus", value:2}, {text: "romulus", value:3} , {text: "rubens", value: 16}, {text: "ruber", value: 6} ,{ text: "rubicon", value: 8}, {text: "rubicundus", value: 9} ];

    //let randomize accountantData values
    for (let i=0; i<accountantData.length; i++)
        accountantData[i].value = Math.random()*1000 +  30;

    it('creating Accountant Radix tree', ()=>{

        accountantTree = new InterfaceAccountantRadixTree();

        accountantData.forEach( (data)=>{
            accountantTree.add( new WebDollarCryptoData(data.text, "ascii"),  {text: data.text, amount: data.value } );
        });

        let result = accountantTree.levelSearch();

        assert(result.length === 5, "Accountant Tree has to many levels");
        assert(result[0].length === 1, "Accountant Tree Level 0 has different nodes");
        assert(result[1].length === 1, "Accountant Tree Level 1 has different nodes");
        assert(result[2].length === 2, "Accountant Tree Level 2 has different nodes");
        assert(result[3].length === 4, "Accountant Tree Level 3 has different nodes");
        assert(result[4].length === 6, "Accountant Tree Level 4 has different nodes");

        let sum = 0;
        for (let i=0; i<accountantData.length; i++)
            sum += accountantData[i].value;

        accountantTree.printLevelSearch();

        assert(result[0][0].value.amount === sum, "Accountant Tree Root Node Amount is different (it was not propagated up) ");

        accountantTree.printLevelSearch();

    });

});

