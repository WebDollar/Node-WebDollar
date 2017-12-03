
var assert = require('assert')


import InterfaceRadixTree from 'common/trees/radix-tree/Interface-Radix-Tree'
import WebDollarCryptoData from 'common/crypto/Webdollar-Crypto-Data'

describe('Interface Radix Tree', () => {


    let radix = null;

    //Based on this tutorial https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/Patricia_trie.svg/350px-Patricia_trie.svg.png
    let radixTestingArray = ["romane","romanus","romulus","rubens", "ruber" , "rubicon", "rubicundus"];

    it('creating radix tree', ()=>{

        radix = new InterfaceRadixTree();

        radixTestingArray.forEach( (str)=>{
            radix.add( new WebDollarCryptoData(str, "ascii"), { address: str } );
            assert(radix.validateTree() === true, "Radix Tree after "+str+" is not Valid");
        })

        let result = radix.levelSearch();

        assert(result.length === 5, "Radix Tree has to many levels")
        assert(result[0].length === 1, "Radix Tree Level 0 has different nodes")
        assert(result[1].length === 1, "Radix Tree Level 1 has different nodes")
        assert(result[2].length === 2, "Radix Tree Level 2 has different nodes")
        assert(result[3].length === 4, "Radix Tree Level 3 has different nodes")
        assert(result[4].length === 6, "Radix Tree Level 4 has different nodes")

        // for (let i =0; i<result[4].length; i++)
        //     console.log(i, result[4][i].value.toString(), result[4][i].parent );

        radix.printLevelSearch();

    });

    it ( "search radix tree", () =>{

        radixTestingArray.forEach( (str)=>{
            let result = radix.search( new WebDollarCryptoData(str, "ascii") );

            assert (result.result === true, "result "+str+" was not found");
        });

        let result8 = radix.search ( new WebDollarCryptoData("rubicundusxx", "ascii") );
        let result9 = radix.search ( new WebDollarCryptoData("ruberr", "ascii") );

        assert (result8.result === false, "result8 was found");
        assert (result9.result === false, "result9 was found");
    })

    it ( "delete radix tree", () =>{

        radixTestingArray.forEach( (str, index)=>{

            let deleteResult =radix.delete(  new WebDollarCryptoData(str, "ascii") );
            assert(deleteResult === true, "delete "+str+" didn't work");

            radix.printLevelSearch();

            assert(radix.validateTree() === true, "Radix Tree deleted after "+str+" is not Valid");

            let searchResult = radix.search ( new WebDollarCryptoData(str, "ascii") );
            assert (!searchResult.result, "result "+str+" was actually found...");

            // the radix sort still, should detect all remaining strings

            for (let j=index+1; j< radixTestingArray.length; j++) {
                let searchResult = radix.search ( new WebDollarCryptoData( radixTestingArray[j], "ascii") );
                assert (searchResult.result === true, "result "+str+" was not found after "+str+" was deleted...");
            }

        });

        let result = radix.levelSearch();

        radix.printLevelSearch();

        assert (result.length === 1, "result is not 1 level");
        assert (result[0].length === 1, "root is not empty");

    });


    it('creating radix tree', ()=>{

    });

});

