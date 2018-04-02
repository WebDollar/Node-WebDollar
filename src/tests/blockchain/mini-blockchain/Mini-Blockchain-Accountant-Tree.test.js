var assert = require('assert')

import TestsHelper from 'tests/Tests.helper'
import WebDollarCoins from "common/utils/coins/WebDollar-Coins"
import Blockchain from 'main-blockchain/Blockchain';
import MiniBlockchainAccountantTree from 'common/blockchain/mini-blockchain/state/Mini-Blockchain-Accountant-Tree'
import InterfaceBlockchainAddressHelper from 'common/blockchain/interface-blockchain/addresses/Interface-Blockchain-Address-Helper'

describe('MiniBlockchainAccountantTree', () => {

    it('save MiniBlockchainAccountantTree Tree', async () => {

        let array = [
                     {addr:"WEBD$gAWbRegeuENxh8SXRJgns6pWZ#&rZHqG#bCPUh35Zkxpbo1s%HsPw==", val: "000661817095001" },
                     {addr:"WEBD$gAvuc$kGH1LQSYo62mPT#YpaVu*pH54rGxWmXfD5NaXi#Nu8svsPw==", val:124213},
                     {addr:"WEBD$gB3TtEpjSy6ts1zToLMm9YUa5NJgh6i2pLhzA$5FXQCe6R%i17sPw==", val: 123233 },
                     {addr:"WEBD$gB34HQUEPTP4GgLJ9M4muGQfS5Q4EC1E1z$f&eASjs6eH1mbezsPw==", val:15323313}
                    ]

        let Tree = new MiniBlockchainAccountantTree(Blockchain.blockchain.db);
        let sum = 0;

        for (let i=0; i<array.length; i++){
            Tree.updateAccount(array[i].addr, array[i].val);
            sum += parseInt(array[i].val);
        }

        assert(!Tree.root.hash.sha256.equals(new Buffer(32)), "root hash is not valid "+Tree.root.hash.sha256.toString("hex"));

        let response = await Tree.saveMiniAccountant(true, "MiniBlockchainAccountantTree.test");

        console.log("response", response);
        assert(response === true, 'save miniblockchain accountant tree : ' + response);

        let Tree2 = new MiniBlockchainAccountantTree(Blockchain.blockchain.db);

        response = await Tree2.loadMiniAccountant(undefined,undefined, true, "MiniBlockchainAccountantTree.test");
        assert(response === true, 'load miniblockchain accountant tree: ' + response);

        assert(Tree2.root.hash.sha256.equals(Tree.root.hash.sha256), " root hash is not the same: " +Tree2.root.hash.sha256.toString("hex")+"  "+Tree.root.hash.sha256.toString("hex"));

        for (let i=0; i<array.length; i++){
            assert( Tree2.getBalance(array[i].addr) === parseInt( array[i].val ), " value is not equal: " +array[i].val+"  "+Tree2.getBalance(array[i].addr));
        }

        assert(Tree2.calculateNodeCoins() === sum, "Sums are not Equals "+" "+ Tree2.calculateNodeCoins().toString() +" "+sum.toString()+" ")

    });


    it('save MiniBlockchainAccountantTree Tree multiple tests', async () => {

        let Tree = new MiniBlockchainAccountantTree(Blockchain.blockchain.db);
        const NUMBERS = 100;

        let sum = 0;
        let list = [];
        for (let i=0; i<NUMBERS; i++){
            let address = InterfaceBlockchainAddressHelper.generateAddress();

            let found =false;
            for (let j=0; j<list.length; j++)
                if (list[j].address === address.address){
                    found = true;
                    break;
                }

            let value = TestsHelper.makeRandomNumber( WebDollarCoins.MAX_SAFE_COINS/NUMBERS, false);
            if (!found && value > 0)
                list.push ( {address:address.address, value: value } );
        }

        for (let i=0; i<list.length; i++){

            try {
                Tree.updateAccount(list[i].address, list[i].value);
                sum += list[i].value;
            } catch (exception){
                console.error("error updating Account", i, list[i]);
                throw exception;
            }

        }

        for (let i=0; i<list.length; i++)
            assert(Tree.getBalance(list[i].address) === list[i].value, " value is not equal: " +list[i].value+"  "+Tree.getBalance(list[i].address));

        assert(!Tree.root.hash.sha256.equals(new Buffer(32)), "root hash is not valid "+Tree.root.hash.sha256.toString("hex"));

        let response = await Tree.saveMiniAccountant(true, "MiniBlockchainAccountantTree.test");
        console.log("response", response);
        assert(response === true, 'save miniblockchain accountant tree : ' + response);

        let Tree2 = new MiniBlockchainAccountantTree(Blockchain.blockchain.db);

        response = await Tree2.loadMiniAccountant(undefined,undefined,true, "MiniBlockchainAccountantTree.test");
        assert(response === true, 'load miniblockchain accountant tree: ' + response);

        assert(Tree2.root.hash.sha256.equals(Tree.root.hash.sha256), " root hash is not the same: " +Tree2.root.hash.sha256.toString("hex")+"  "+Tree.root.hash.sha256.toString("hex"));


        for (let i=0; i<list.length; i++)
            assert(Tree2.getBalance(list[i].address) === list[i].value, " value is not equal: " +list[i].value+"  "+Tree2.getBalance(list[i].address));

        assert(Tree2.calculateNodeCoins() === sum, "Sums are not Equals "+" "+ Tree2.calculateNodeCoins().toString() +" "+sum.toString()+" ")
    });

});
