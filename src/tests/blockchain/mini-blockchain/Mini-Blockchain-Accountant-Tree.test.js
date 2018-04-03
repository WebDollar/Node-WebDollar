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

        assert(response === true, 'save miniblockchain accountant tree : ' + response);

        let Tree2 = new MiniBlockchainAccountantTree(Blockchain.blockchain.db);

        response = await Tree2.loadMiniAccountant(undefined,undefined, true, "MiniBlockchainAccountantTree.test");
        assert(response === true, 'load miniblockchain accountant tree: ' + response);

        assert(Tree2.root.hash.sha256.equals(Tree.root.hash.sha256), " root hash is not the same: " +Tree2.root.hash.sha256.toString("hex")+"  "+Tree.root.hash.sha256.toString("hex"));

        for (let i=0; i<array.length; i++){
            assert(Tree2.getBalance(array[i].addr) === Tree.getBalance(array[i].addr), "final balance is not right after deserialization "+Tree2.getBalance(array[i].addr)+" "+Tree.getBalance(array[i].addr)+" "+JSON.stringify(array[i]) );
            assert(Tree2.getAccountNonce(array[i].addr) === Tree.getAccountNonce(array[i].addr), "final nonce is not right after deserialization "+Tree2.getAccountNonce(array[i].addr+" "+Tree.getAccountNonce(array[i].addr))+" "+JSON.stringify(array[i]));

            assert( Tree2.getBalance(array[i].addr) === parseInt( array[i].val ), " value is not equal: " +array[i].val+"  "+Tree2.getBalance(array[i].addr));
        }

        assert(Tree2.calculateNodeCoins() === sum, "Sums are not Equals "+" "+ Tree2.calculateNodeCoins().toString() +" "+sum.toString()+" ")

    });


    it('save MiniBlockchainAccountantTree Tree multiple tests', async () => {

        let Tree = new MiniBlockchainAccountantTree(Blockchain.blockchain.db);
        const NUMBERS = 100;

        let sum = 0;
        let list = [];
        let addresses = TestsHelper.generateAddresses(NUMBERS);

        for (let i=0; i<addresses.length; i++){
            list[i] = {
                address: addresses[i],
                value: TestsHelper.makeRandomNumber(WebDollarCoins.MAX_SAFE_COINS / NUMBERS, false) + 1,
            }
        }

        for (let i=0; i<list.length; i++)

            try {
                Tree.updateAccount(list[i].address, list[i].value);
                sum += list[i].value;
            } catch (exception){
                console.error("error updating Account", i, list[i]);
                throw exception;
            }

        for (let i=0; i<list.length; i++)
            assert(Tree.getBalance(list[i].address) === list[i].value, " value is not equal: " +list[i].value+"  "+Tree.getBalance(list[i].address));

        assert(!Tree.root.hash.sha256.equals(new Buffer(32)), "root hash is not valid "+Tree.root.hash.sha256.toString("hex"));

        let response = await Tree.saveMiniAccountant(true, "MiniBlockchainAccountantTree.test");

        assert(response === true, 'save miniblockchain accountant tree : ' + response);

        let Tree2 = new MiniBlockchainAccountantTree(Blockchain.blockchain.db);

        response = await Tree2.loadMiniAccountant(undefined,undefined,true, "MiniBlockchainAccountantTree.test");
        assert(response === true, 'load miniblockchain accountant tree: ' + response);

        assert(Tree2.root.hash.sha256.equals(Tree.root.hash.sha256), " root hash is not the same: " +Tree2.root.hash.sha256.toString("hex")+"  "+Tree.root.hash.sha256.toString("hex"));


        for (let i=0; i<list.length; i++) {

            assert(Tree2.getBalance(list[i].address) === Tree.getBalance(list[i].address), "final balance is not right after deserialization "+Tree2.getBalance(list[i].address)+" "+Tree.getBalance(list[i].address)+" "+JSON.stringify(list[i]) );
            assert(Tree2.getAccountNonce(list[i].address) === Tree.getAccountNonce(list[i].address), "final nonce is not right after deserialization "+Tree2.getAccountNonce(list[i].address+" "+Tree.getAccountNonce(list[i].address))+" "+JSON.stringify(list[i]));

            assert(Tree2.getBalance(list[i].address) === list[i].value, " value is not equal: " + list[i].value + "  " + Tree2.getBalance(list[i].address));
        }

        assert(Tree2.calculateNodeCoins() === sum, "Sums are not Equals "+" "+ Tree2.calculateNodeCoins().toString() +" "+sum.toString()+" ")
    });



    it('save MiniBlockchainAccountantTree Tree multiple tests with + - ', async () => {

        let Tree = new MiniBlockchainAccountantTree(Blockchain.blockchain.db);
        const NUMBERS = 100;

        let sum = 0;
        let list = [];
        let addresses = TestsHelper.generateAddresses(NUMBERS);

        for (let i=0; i<addresses.length; i++){

            let value = TestsHelper.makeRandomNumber(WebDollarCoins.MAX_SAFE_COINS / (NUMBERS*10), false) + 1;
            list[i] = {
                address: addresses[i],
                value1: value,
            };

            switch (Math.floor(Math.random() * 3 )){

                case 0:
                    list[i].value2 = Math.floor(Math.random()*value);
                    break;
                case 1:
                    list[i].value2 = -Math.floor(Math.random()*value);
                    break;
                case 2:
                    list[i].value2 = -value;
                    break;
            }

        }




        for (let i=0; i<list.length; i++)
            try {
                Tree.updateAccount(list[i].address, list[i].value1);
                sum += list[i].value1;
            } catch (exception){
                console.error("error updating Account 1", i, list[i]);
                throw exception;
            }

        for (let i=0; i<list.length; i++)
            try {
                Tree.updateAccount(list[i].address, list[i].value2);
                sum += list[i].value2;
            } catch (exception){
                console.error("error updating Account 2", i, list[i]);
                console.error(list);
                throw exception;
            }

        for (let i=0; i<list.length; i++) {

            let sum = (list[i].value1 + list[i].value2);
            if (sum === 0) sum = null;
            assert(Tree.getBalance(list[i].address) === sum, " value is not equal: " + list[i].value + list[i].value2 + "  " + Tree.getBalance(list[i].address));
        }

        assert(!Tree.root.hash.sha256.equals(new Buffer(32)), "root hash is not valid "+Tree.root.hash.sha256.toString("hex"));

        let response = await Tree.saveMiniAccountant(true, "MiniBlockchainAccountantTree.test");

        assert(response === true, 'save miniblockchain accountant tree : ' + response);

        let Tree2 = new MiniBlockchainAccountantTree(Blockchain.blockchain.db);

        response = await Tree2.loadMiniAccountant(undefined,undefined,true, "MiniBlockchainAccountantTree.test");
        assert(response === true, 'load miniblockchain accountant tree: ' + response);

        assert(Tree2.root.hash.sha256.equals(Tree.root.hash.sha256), " root hash is not the same: " +Tree2.root.hash.sha256.toString("hex")+"  "+Tree.root.hash.sha256.toString("hex"));


        for (let i=0; i<list.length; i++) {

            assert(Tree2.getBalance(list[i].address) === Tree.getBalance(list[i].address), "final balance is not right after deserialization "+Tree2.getBalance(list[i].address)+" "+Tree.getBalance(list[i].address)+" "+JSON.stringify(list[i]) );
            assert(Tree2.getAccountNonce(list[i].address) === Tree.getAccountNonce(list[i].address), "final nonce is not right after deserialization "+Tree2.getAccountNonce(list[i].address+" "+Tree.getAccountNonce(list[i].address))+" "+JSON.stringify(list[i]));

            let sum = (list[i].value1 + list[i].value2);
            if (sum === 0) sum = null;
            assert(Tree2.getBalance(list[i].address) === sum, " value is not equal: " + (list[i].value1 + list[i].value2) + "  " + Tree2.getBalance(list[i].address));
        }

        assert(Tree2.calculateNodeCoins() === sum, "Sums are not Equals "+" "+ Tree2.calculateNodeCoins().toString() +" "+sum.toString()+" ")
    });



    it('save MiniBlockchainAccountantTree Tree multiple tests with + - NONCES', async () => {

        let Tree = new MiniBlockchainAccountantTree(Blockchain.blockchain.db);
        const NUMBERS = 100;

        let sum = 0;
        let list = [];
        let addresses = TestsHelper.generateAddresses(NUMBERS);

        for (let i=0; i<addresses.length; i++){

            let value = TestsHelper.makeRandomNumber(WebDollarCoins.MAX_SAFE_COINS / (NUMBERS*100), false) + 1;

            list[i] = {
                address: addresses[i],
                value1: value,
            };

            switch (Math.floor(Math.random() * 3 )){

                case 0:
                    list[i].value2 = Math.floor(Math.random()*value);
                    break;

                case 1:
                    list[i].value2 = -Math.floor(Math.random()*value);
                    break;

                case 2:
                    list[i].value2 = -value;
                    break;
            }

            if (Math.floor(Math.random() * 2 )=== 0)
                list[i].nonce1 = Math.floor(Math.random()*100)+1;
            else
                list[i].nonce1 = 0;

            if (list[i].nonce1 !== 0)
                switch (Math.floor(Math.random() * 3 )){

                    case 0:
                        list[i].nonce2 = 0;
                        break;

                    case 1:
                        list[i].nonce2 = - list[i].nonce1;
                        break;

                    case 2:
                        list[i].nonce2 = - Math.floor( Math.random()*list[i].nonce1 );
                        break;
                }
            else list[i].nonce2 = 0;

            let nonceDiff = list[i].nonce1 + list[i].nonce2;
            if (nonceDiff > 0){

                switch (Math.floor(Math.random() * 3 )){

                    case 0:
                        list[i].nonce3 = 0;
                        break;

                    case 1:
                        list[i].nonce3 = - nonceDiff;
                        break;

                    case 2:
                        list[i].nonce3 = - Math.floor( Math.random()* nonceDiff );
                        break;
                }

            } else list[i].nonce3 = 0;
        }

        // +value1
        for (let i=0; i<list.length; i++)
            try {
                Tree.updateAccount(list[i].address, list[i].value1);
                sum += list[i].value1;
            } catch (exception){
                console.error("error updating Account 1", i, list[i]);
                throw exception;
            }

        // +nonce1
        for (let i=0; i<list.length; i++)
            try {
                Tree.updateAccountNonce(list[i].address, list[i].nonce1);
            } catch (exception){
                console.error("error updating Account Nonce1", i, list[i]);
                throw exception;
            }

        // +nonce2
        for (let i=0; i<list.length; i++)
            try {
                if (list[i].nonce2 !== 0)
                    Tree.updateAccountNonce(list[i].address, list[i].nonce2);
            } catch (exception){
                console.error("error updating Account Nonce2", i, list[i]);
                throw exception;
            }

        // +update2
        for (let i=0; i<list.length; i++)
            try {
                Tree.updateAccount(list[i].address, list[i].value2);
                sum += list[i].value2;
            } catch (exception){
                console.error("error updating Account 2", i, list[i]);
                throw exception;
            }

        // +nonce3
        for (let i=0; i<list.length; i++)
            try {
                if (list[i].nonce3 !== 0)
                    Tree.updateAccountNonce(list[i].address, list[i].nonce3);
            } catch (exception){
                console.error("error updating Account Nonce3", i, list[i]);
                throw exception;
            }

        for (let i=0; i<list.length; i++) {

            let sum = (list[i].value1 + list[i].value2);

            //TODO WINDOW Transactions
            if (sum === 0)
                if ( (list[i].nonce1 + list[i].nonce2 + list[i].nonce3) !== 0)
                    console.log("Address still has nonce", Tree.getBalance(list[i].address))
                else
                    sum = null;

            if (Tree.getBalance(list[i].address) !== sum)
                console.error("ERROR! BALANCE IS NOT RIGHT");

            assert(Tree.getBalance(list[i].address) === sum, " balance value is not equal: " + sum + "  " + Tree.getBalance(list[i].address));
        }

        for (let i=0; i<list.length; i++) {

            let sum = (list[i].nonce1 + list[i].nonce2 + list[i].nonce3);

            if (sum === 0)
                if (list[i].value1 + list[i].value2 === 0){

                    //TODO WINDOW Transactions
                    Tree.getAccountNonce(list[i].address);

                    assert(Tree.getAccountNonce(list[i].address) === null, " nonce 2 is not equal: " + 'null' + "  " + Tree.getAccountNonce(list[i].address));

                    continue;

                }


            assert(Tree.getAccountNonce(list[i].address) === sum, " nonce 2 is not equal: " + sum + "  " + Tree.getBalance(list[i].address));
        }

        assert(!Tree.root.hash.sha256.equals(new Buffer(32)), "root hash is not valid "+Tree.root.hash.sha256.toString("hex"));

        let response = await Tree.saveMiniAccountant(true, "MiniBlockchainAccountantTree.test");

        assert(response === true, 'save miniblockchain accountant tree : ' + response);

        let Tree2 = new MiniBlockchainAccountantTree(Blockchain.blockchain.db);

        response = await Tree2.loadMiniAccountant(undefined,undefined,true, "MiniBlockchainAccountantTree.test");
        assert(response === true, 'load miniblockchain accountant tree: ' + response);

        assert(Tree2.root.hash.sha256.equals(Tree.root.hash.sha256), " root hash is not the same: " +Tree2.root.hash.sha256.toString("hex")+"  "+Tree.root.hash.sha256.toString("hex"));


        for (let i=0; i<list.length; i++) {

            assert(Tree2.getBalance(list[i].address) === Tree.getBalance(list[i].address), "final balance is not right after deserialization "+Tree2.getBalance(list[i].address)+" "+Tree.getBalance(list[i].address)+" "+JSON.stringify(list[i]) );
            assert(Tree2.getAccountNonce(list[i].address) === Tree.getAccountNonce(list[i].address), "final nonce is not right after deserialization "+Tree2.getAccountNonce(list[i].address+" "+Tree.getAccountNonce(list[i].address))+" "+JSON.stringify(list[i]));

            let sum = (list[i].value1 + list[i].value2);

            //TODO WINDOW Transactions
            if (sum === 0)
                if ( (list[i].nonce1 + list[i].nonce2 + list[i].nonce3) !== 0)
                    console.log("Address still has nonce", Tree2.getBalance(list[i].address))
                else
                    sum = null;

            if (Tree2.getBalance(list[i].address) !== sum)
                console.error("ERROR! BALANCE IS NOT RIGHT");

            assert(Tree2.getBalance(list[i].address) === sum, " final balance value is not equal: " + (sum) + "  " + Tree2.getBalance(list[i].address));
        }

        assert(Tree2.calculateNodeCoins() === sum, "Sums are not Equals "+" "+ Tree2.calculateNodeCoins().toString() +" "+sum.toString()+" ")
    });


});
