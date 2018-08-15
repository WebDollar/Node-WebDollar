import BufferExtended from "common/utils/BufferExtended";

var assert = require('assert')

import TestsHelper from 'tests/Tests.helper'
import WebDollarCoins from "common/utils/coins/WebDollar-Coins"
import Blockchain from 'main-blockchain/Blockchain';
import MiniBlockchainAccountantTree from 'common/blockchain/mini-blockchain/state/Mini-Blockchain-Accountant-Tree'
import InterfaceBlockchainAddressHelper from 'common/blockchain/interface-blockchain/addresses/Interface-Blockchain-Address-Helper'
import consts from 'consts/const_global'

describe('MiniBlockchainAccountantTree', () => {

    it('save MiniBlockchainAccountantTree Tree', async () => {

        let array = [
                     {addr: "WEBD$gCnD#W5qC6g#u0XD$8orGEhTYoCx+VDEH$$", val: "000661817095001" },
                     {addr: "WEBD$gAePSrtnvtesE6#xeKsvV4dkFbjGI6Q9kD$", val: 124213},
                     {addr: "WEBD$gDojfYVXudrLz$XHyJQtFIYxBeS+fNQaoL$", val: 123233 },
                     {addr: "WEBD$gBzsiV+$FARK8qSGqs09V6AEDBi#@fP6n7$", val: 15323313}
            ];

        let Tree = new MiniBlockchainAccountantTree(Blockchain.blockchain.db);
        let sum = 0;

        for (let i = 0; i < array.length; i++){
            Tree.updateAccount(array[i].addr, array[i].val);
            sum += parseInt(array[i].val);
        }

        assert(!Tree.root.hash.equals(new Buffer(32)), "root hash is not valid "+Tree.root.hash.toString("hex"));

        let response = await Tree.saveMiniAccountant(true, "MiniBlockchainAccountantTree.test");

        assert(response === true, 'save miniblockchain accountant tree : ' + response);

        let Tree2 = new MiniBlockchainAccountantTree(Blockchain.blockchain.db);

        response = await Tree2.loadMiniAccountant(undefined,undefined, true, "MiniBlockchainAccountantTree.test");
        assert(response === true, 'load miniblockchain accountant tree: ' + response);

        assert(Tree2.root.hash.equals(Tree.root.hash), " root hash is not the same: " +Tree2.root.hash.toString("hex")+"  "+Tree.root.hash.toString("hex"));

        for (let i = 0; i < array.length; i++){
            assert(Tree2.getBalance(array[i].addr) === Tree.getBalance(array[i].addr), "final balance is not right after deserialization "+Tree2.getBalance(array[i].addr)+" "+Tree.getBalance(array[i].addr)+" "+JSON.stringify(array[i]) );
            assert(Tree2.getAccountNonce(array[i].addr) === Tree.getAccountNonce(array[i].addr), "final nonce is not right after deserialization "+Tree2.getAccountNonce(array[i].addr+" "+Tree.getAccountNonce(array[i].addr))+" "+JSON.stringify(array[i]));

            assert( Tree2.getBalance(array[i].addr) === parseInt( array[i].val ), " value is not equal: " +array[i].val+"  "+Tree2.getBalance(array[i].addr));
        }

        assert(Tree2.calculateNodeCoins() === sum, "Sums are not Equals "+" "+ Tree2.calculateNodeCoins().toString() +" "+sum.toString()+" ");

    });


    it('save MiniBlockchainAccountantTree Tree multiple tests', async () => {

        let Tree = new MiniBlockchainAccountantTree(Blockchain.blockchain.db);
        const NUMBERS = 200;

        let sum = 0;
        let list = [];
        let addresses = TestsHelper.generateAddresses(NUMBERS);

        for (let i = 0; i < addresses.length; i++){
            list[i] = {
                address: addresses[i],
                value: TestsHelper.makeRandomNumber(WebDollarCoins.MAX_SAFE_COINS / NUMBERS, false) + 1,
            }
        }

        for (let i = 0; i < list.length; i++){

            try {
                Tree.updateAccount(list[i].address, list[i].value);
                sum += list[i].value;
            } catch (exception){
                console.error("error updating Account", i, list[i]);
                throw exception;
            }
        }

        for (let i = 0; i < list.length; i++)
            assert(Tree.getBalance(list[i].address) === list[i].value, " value is not equal: " +list[i].value+"  "+Tree.getBalance(list[i].address));

        assert(!Tree.root.hash.equals(new Buffer(32)), "root hash is not valid "+Tree.root.hash.toString("hex"));

        let response = await Tree.saveMiniAccountant(true, "MiniBlockchainAccountantTree.test");

        assert(response === true, 'save miniblockchain accountant tree : ' + response);

        let Tree2 = new MiniBlockchainAccountantTree(Blockchain.blockchain.db);

        response = await Tree2.loadMiniAccountant(undefined,undefined,true, "MiniBlockchainAccountantTree.test");
        assert(response === true, 'load miniblockchain accountant tree: ' + response);

        assert(Tree2.root.hash.equals(Tree.root.hash), " root hash is not the same: " +Tree2.root.hash.toString("hex")+"  "+Tree.root.hash.toString("hex"));


        for (let i = 0; i < list.length; i++) {

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

        for (let i = 0; i < addresses.length; i++){

            let value = TestsHelper.makeRandomNumber(WebDollarCoins.MAX_SAFE_COINS / (NUMBERS*10), false) + 1;
            list[i] = {
                address: addresses[i],
                value1: value,
                value2: 0,
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


        for (let i = 0; i < list.length; i++)
            try {
                Tree.updateAccount(list[i].address, list[i].value1);
                sum += list[i].value1;
            } catch (exception){
                console.error("error updating Account 1", i, list[i]);
                throw exception;
            }

        for (let i = 0; i < list.length; i++)
            try {
                Tree.updateAccount(list[i].address, list[i].value2);
                sum += list[i].value2;
            } catch (exception){
                console.error("error updating Account 2", i, list[i]);
                console.error(list);
                throw exception;
            }

        for (let i = 0; i < list.length; i++) {

            let sum = (list[i].value1 + list[i].value2);
            if (sum === 0) sum = null;
            assert(Tree.getBalance(list[i].address) === sum, " value is not equal: " + list[i].value + list[i].value2 + "  " + Tree.getBalance(list[i].address));
        }

        assert(!Tree.root.hash.equals(new Buffer(32)), "root hash is not valid "+Tree.root.hash.toString("hex"));

        let response = await Tree.saveMiniAccountant(true, "MiniBlockchainAccountantTree.test");

        assert(response === true, 'save miniblockchain accountant tree : ' + response);

        let Tree2 = new MiniBlockchainAccountantTree(Blockchain.blockchain.db);

        response = await Tree2.loadMiniAccountant(undefined,undefined,true, "MiniBlockchainAccountantTree.test");
        assert(response === true, 'load miniblockchain accountant tree: ' + response);

        assert(Tree2.root.hash.equals(Tree.root.hash), " root hash is not the same: " +Tree2.root.hash.toString("hex")+"  "+Tree.root.hash.toString("hex"));


        for (let i = 0; i < list.length; i++) {

            let address = BufferExtended.fromBase(list[i].address);
            assert (address.length === consts.ADDRESSES.ADDRESS.WIF.LENGTH, "Address is invalid!!!" + list[i].address + " " + consts.ADDRESSES.ADDRESS.WIF.LENGTH);

            try{
                if (!Tree2.getBalance(list[i].address) === Tree.getBalance(list[i].address) )
                    throw {message: "didn't match 1", balance2: Tree2.getBalance(list[i].address), balance1: Tree.getBalance(list[i].address)}
                if (!Tree2.getAccountNonce(list[i].address) === Tree.getAccountNonce(list[i].address))
                    throw {message: "didn't match 2", balance2: Tree2.getAccountNonce(list[i].address), balance1: Tree.getAccountNonce(list[i].address)};

                let sum = (list[i].value1 + list[i].value2);
                if (sum === 0) sum = null;

                if (!Tree2.getBalance(list[i].address) === sum)
                    throw {message: " value is not equal: " + (list[i].value1 + list[i].value2)}

            } catch (exception){
                console.error(exception, list[i].address);
            }


        }

        assert(Tree2.calculateNodeCoins() === sum, "Sums are not Equals "+" "+ Tree2.calculateNodeCoins().toString() +" "+sum.toString()+" ")
    });



    it('save MiniBlockchainAccountantTree Tree multiple tests with + - NONCES', async () => {

        let Tree = new MiniBlockchainAccountantTree(Blockchain.blockchain.db);
        const NUMBERS = 100;

        let sum = 0;
        let list = [];
        let addresses = TestsHelper.generateAddresses(NUMBERS);

        for (let i = 0; i < addresses.length; i++){

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
                        list[i].nonce3 = - Math.floor( Math.random() * nonceDiff );
                        break;
                }

            } else list[i].nonce3 = 0;
        }

        // +value1
        for (let i = 0; i < list.length; i++)
            try {
                Tree.updateAccount(list[i].address, list[i].value1);
                sum += list[i].value1;
            } catch (exception){
                console.error("error updating Account 1", i, list[i]);
                throw exception;
            }

        // +nonce1
        for (let i = 0; i < list.length; i++)
            try {
                Tree.updateAccountNonce(list[i].address, list[i].nonce1);
            } catch (exception){
                console.error("error updating Account Nonce1", i, list[i]);
                throw exception;
            }

        // +nonce2
        for (let i = 0; i < list.length; i++)
            try {
                if (list[i].nonce2 !== 0)
                    Tree.updateAccountNonce(list[i].address, list[i].nonce2);
            } catch (exception){
                console.error("error updating Account Nonce2", i, list[i]);
                throw exception;
            }

        // +update2
        for (let i = 0; i < list.length; i++)
            try {
                Tree.updateAccount(list[i].address, list[i].value2);
                sum += list[i].value2;
            } catch (exception){
                console.error("error updating Account 2", i, list[i]);
                throw exception;
            }

        // +nonce3
        for (let i = 0; i < list.length; i++)
            try {
                if (list[i].nonce3 !== 0)
                    Tree.updateAccountNonce(list[i].address, list[i].nonce3);
            } catch (exception){
                console.error("error updating Account Nonce3", i, list[i]);
                throw exception;
            }

        for (let i = 0; i < list.length; i++) {

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

        for (let i = 0; i < list.length; i++) {

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

        assert(!Tree.root.hash.equals(new Buffer(32)), "root hash is not valid "+Tree.root.hash.toString("hex"));

        let response = await Tree.saveMiniAccountant(true, "MiniBlockchainAccountantTree.test");

        assert(response === true, 'save miniblockchain accountant tree : ' + response);

        let Tree2 = new MiniBlockchainAccountantTree(Blockchain.blockchain.db);

        response = await Tree2.loadMiniAccountant(undefined,undefined,true, "MiniBlockchainAccountantTree.test");
        assert(response === true, 'load miniblockchain accountant tree: ' + response);

        assert(Tree2.root.hash.equals(Tree.root.hash), " root hash is not the same: " +Tree2.root.hash.toString("hex")+"  "+Tree.root.hash.toString("hex"));


        for (let i = 0; i < list.length; i++) {

            let address = BufferExtended.fromBase(list[i].address);
            assert (address.length === consts.ADDRESSES.ADDRESS.WIF.LENGTH, "Address is invalid!!!" + list[i].address + " " + consts.ADDRESSES.ADDRESS.WIF.LENGTH);

            try{
                if (!Tree2.getBalance(list[i].address) === Tree.getBalance(list[i].address) )
                    throw {message: "didn't match 1", balance2: Tree2.getBalance(list[i].address), balance1: Tree.getBalance(list[i].address)}
                if (!Tree2.getAccountNonce(list[i].address) === Tree.getAccountNonce(list[i].address))
                    throw {message: "didn't match 2", balance2: Tree2.getAccountNonce(list[i].address), balance1: Tree.getAccountNonce(list[i].address)};

            } catch (exception){
                console.error(exception, list[i].address);
            }
        }

        assert(Tree2.calculateNodeCoins() === sum, "Sums are not Equals "+" "+ Tree2.calculateNodeCoins().toString() +" "+sum.toString()+" ")
    });


    it('save MiniBlockchainAccountantTree Tree multiple tests with + - NONCES', async () => {

        let Tree = new MiniBlockchainAccountantTree(Blockchain.blockchain.db);
        const NUMBER_ADDRESSES = 100;
        const NUMBER_TESTS = 1000;

        let sumTotal = 0;
        let addresses = TestsHelper.generateAddresses(NUMBER_ADDRESSES);

        let list = [];

        addresses.forEach((address)=>{

            list.push({
                address: address,
                sumValue: 0,
                sumNonce: 0,
            })

        });

        for (let i = 0; i < NUMBER_TESTS; i++){

            let index = Math.floor ( Math.random() * NUMBER_ADDRESSES );

            let address = list[index].address;
            let tests = Math.floor( Math.random() * 100 );

            for (let i = 0; i < tests; i++){

                let test = Math.floor( Math.random() * 6 );

                let nonce = 0;
                let value = 0;

                switch (test){

                    case 0:
                        value = Math.floor( Math.random() * WebDollarCoins.MAX_SAFE_COINS / 100 );
                        break;

                    case 1:
                        nonce += Math.floor( Math.random() * WebDollarCoins.MAX_SAFE_COINS / 100 );
                        break;

                    case 2:
                        value = -Math.floor( Math.random() *  list[index].sumValue );
                        break;

                    case 3:
                        nonce = - Math.floor( Math.random() * list[index].sumNonce );
                        break;

                    case 4:
                        value = - list[index].sumValue ;
                        break;

                    case 5:
                        nonce = - list[index].sumNonce;
                        break;

                }

                if (value !== 0 ){

                    try{

                        Tree.updateAccount(address, value);

                        if (value <= 0 && list[index].sumValue === 0)
                            throw "Impossible value";

                        list[index].sumValue += value;

                        sumTotal += value;
                    }catch (exception){

                        if ( list[index].sumValue + value > 0)
                            throw "It should return an error";
                    }


                } else
                if (nonce !== 0){

                    try{

                        Tree.updateAccountNonce(address, value);

                        if (nonce <=0 && list[index].nonce === 0)
                            throw "Impossible nonce";

                        list[index].sumNonce += value;

                    } catch (exception){

                        if ( list[index].sumValue  > 0) throw "It should return an error";
                        if ( list[index].sumNonce  > 0) throw "It should return an error";

                    }


                }

            }


        }

        for (let i = 0; i < list.length; i++) {

            let sum = list[i].sumValue;

            //TODO WINDOW Transactions
            if (sum === 0)
                if (list[i].sumNonce !== 0)
                    console.log("Address still has nonce", Tree.getBalance(list[i].address));
                else
                    sum = null;

            if (Tree.getBalance(list[i].address) !== sum)
                console.error("ERROR! BALANCE IS NOT RIGHT");

            assert(Tree.getBalance(list[i].address) === sum, " balance value is not equal: " + sum + "  " + Tree.getBalance(list[i].address));
        }

        for (let i = 0; i < list.length; i++) {

            let sum = list[i].sumNonce;

            if (sum === 0)
                if (list[i].sumValue === 0){

                    //TODO WINDOW Transactions
                    Tree.getAccountNonce(list[i].address);

                    assert(Tree.getAccountNonce(list[i].address) === null, " nonce 2 is not equal: " + 'null' + "  " + Tree.getAccountNonce(list[i].address));

                    continue;
                }


            assert(Tree.getAccountNonce(list[i].address) === sum, " nonce 2 is not equal: " + sum + "  " + Tree.getBalance(list[i].address));
        }

        assert(!Tree.root.hash.equals(new Buffer(32)), "root hash is not valid "+Tree.root.hash.toString("hex"));

        let response = await Tree.saveMiniAccountant(true, "MiniBlockchainAccountantTree.test");

        assert(response === true, 'save miniblockchain accountant tree : ' + response);

        let Tree2 = new MiniBlockchainAccountantTree(Blockchain.blockchain.db);

        response = await Tree2.loadMiniAccountant(undefined, undefined, true, "MiniBlockchainAccountantTree.test");
        assert(response === true, 'load miniblockchain accountant tree: ' + response);

        assert(Tree2.root.hash.equals(Tree.root.hash), " root hash is not the same: " +Tree2.root.hash.toString("hex")+"  "+Tree.root.hash.toString("hex"));


        for (let i = 0; i < list.length; i++) {

            let address = BufferExtended.fromBase(list[i].address);
            assert (address.length === consts.ADDRESSES.ADDRESS.WIF.LENGTH, "Address is invalid!!!" + list[i].address + " " + consts.ADDRESSES.ADDRESS.WIF.LENGTH);

            try{
                if (!Tree2.getBalance(list[i].address) === Tree.getBalance(list[i].address) )
                    throw {message: "didn't match 1", balance2: Tree2.getBalance(list[i].address), balance1: Tree.getBalance(list[i].address)}
                if (!Tree2.getAccountNonce(list[i].address) === Tree.getAccountNonce(list[i].address))
                    throw {message: "didn't match 2", balance2: Tree2.getAccountNonce(list[i].address), balance1: Tree.getAccountNonce(list[i].address)};

            } catch (exception){
                console.error(exception, list[i].address);
            }
        }

        assert(Tree2.calculateNodeCoins() === sumTotal, "Sums are not Equals "+" "+ Tree2.calculateNodeCoins().toString() +" "+sumTotal.toString()+" ")
    });



    it('save MiniBlockchainAccountantTree Tree multiple tests with + - NONCES', async () => {

        let Tree = new MiniBlockchainAccountantTree(Blockchain.blockchain.db);
        const NUMBER_ADDRESSES = 100;
        const NUMBER_TESTS = 1000;

        let sumTotal = 0;
        let addresses = TestsHelper.generateAddresses(NUMBER_ADDRESSES);

        let list = [];

        addresses.forEach((address)=>{

            list.push({
                address: address,
                sumValue: 0,
                sumNonce: 0,
            })

        });

        for (let i = 0; i < NUMBER_TESTS; i++){

            let index = Math.floor ( Math.random() * NUMBER_ADDRESSES );

            let address = list[index].address;
            let tests = Math.floor( Math.random() * 100 );

            for (let i = 0; i < tests; i++){

                let test = Math.floor( Math.random() * 6 );

                let nonce = 0;
                let value = 0;

                switch (test){

                    case 0:
                        value = Math.floor( Math.random() * WebDollarCoins.MAX_SAFE_COINS / 100 );
                        break;

                    case 1:
                        nonce += Math.floor( Math.random() * WebDollarCoins.MAX_SAFE_COINS / 100 );
                        break;

                    case 2:
                        value = -Math.floor( Math.random() *  list[index].sumValue );
                        break;

                    case 3:
                        nonce = - Math.floor( Math.random() * list[index].sumNonce );
                        break;

                    case 4:
                        value = - list[index].sumValue ;
                        break;

                    case 5:
                        nonce = - list[index].sumNonce;
                        break;

                }

                if (value !== 0 ){

                    try{

                        Tree.updateAccount(address, value);

                        if (value <= 0 && list[index].sumValue === 0)
                            throw "Impossible value";

                        list[index].sumValue += value;

                        sumTotal += value;
                    }catch (exception){

                        if ( list[index].sumValue + value > 0)
                            throw "It should return an error";
                    }


                } else
                if (nonce !== 0){

                    try{

                        Tree.updateAccountNonce(address, value);

                        if (nonce <=0 && list[index].nonce === 0)
                            throw "Impossible nonce";

                        list[index].sumNonce += value;

                    } catch (exception){

                        if ( list[index].sumValue  > 0) throw "It should return an error";
                        if ( list[index].sumNonce  > 0) throw "It should return an error";

                    }


                }

            }


        }

        for (let i = 0; i < list.length; i++) {

            let sum = list[i].sumValue;

            //TODO WINDOW Transactions
            if (sum === 0)
                if (list[i].sumNonce !== 0)
                    console.log("Address still has nonce", Tree.getBalance(list[i].address));
                else
                    sum = null;

            if (Tree.getBalance(list[i].address) !== sum)
                console.error("ERROR! BALANCE IS NOT RIGHT");

            assert(Tree.getBalance(list[i].address) === sum, " balance value is not equal: " + sum + "  " + Tree.getBalance(list[i].address));
        }

        for (let i = 0; i < list.length; i++) {

            let sum = list[i].sumNonce;

            if (sum === 0)
                if (list[i].sumValue === 0){

                    //TODO WINDOW Transactions
                    Tree.getAccountNonce(list[i].address);

                    assert(Tree.getAccountNonce(list[i].address) === null, " nonce 2 is not equal: " + 'null' + "  " + Tree.getAccountNonce(list[i].address));

                    continue;
                }


            assert(Tree.getAccountNonce(list[i].address) === sum, " nonce 2 is not equal: " + sum + "  " + Tree.getBalance(list[i].address));
        }

        assert(!Tree.root.hash.equals(new Buffer(32)), "root hash is not valid "+Tree.root.hash.toString("hex"));

        let response = await Tree.saveMiniAccountant(true, "MiniBlockchainAccountantTree.test");

        assert(response === true, 'save miniblockchain accountant tree : ' + response);

        let Tree2 = new MiniBlockchainAccountantTree(Blockchain.blockchain.db);

        response = await Tree2.loadMiniAccountant(undefined, undefined, true, "MiniBlockchainAccountantTree.test");
        assert(response === true, 'load miniblockchain accountant tree: ' + response);

        assert(Tree2.root.hash.equals(Tree.root.hash), " root hash is not the same: " +Tree2.root.hash.toString("hex")+"  "+Tree.root.hash.toString("hex"));


        for (let i = 0; i < list.length; i++) {

            let address = BufferExtended.fromBase(list[i].address);
            assert (address.length === consts.ADDRESSES.ADDRESS.WIF.LENGTH, "Address is invalid!!!" + list[i].address + " " + consts.ADDRESSES.ADDRESS.WIF.LENGTH);

            try{
                if (!Tree2.getBalance(list[i].address) === Tree.getBalance(list[i].address) )
                    throw {message: "didn't match 1", balance2: Tree2.getBalance(list[i].address), balance1: Tree.getBalance(list[i].address)}
                if (!Tree2.getAccountNonce(list[i].address) === Tree.getAccountNonce(list[i].address))
                    throw {message: "didn't match 2", balance2: Tree2.getAccountNonce(list[i].address), balance1: Tree.getAccountNonce(list[i].address)};

            } catch (exception){
                console.error(exception, list[i].address);
            }
        }

        assert(Tree2.calculateNodeCoins() === sumTotal, "Sums are not Equals "+" "+ Tree2.calculateNodeCoins().toString() +" "+sumTotal.toString()+" ")
    });





    it('MiniBlockchainAccountantTree Tree test symmetric using lexicographic comparisons ', async () => {


        let Tree1 = new MiniBlockchainAccountantTree(Blockchain.blockchain.db);
        let Tree2 = new MiniBlockchainAccountantTree(Blockchain.blockchain.db);

        const NUMBER_ADDRESSES = 100;
        const NUMBER_TESTS = 1000;

        let sumTotal = 0;
        let addresses = TestsHelper.generateAddresses(NUMBER_ADDRESSES);
        let tests = [];

        for (let i = 0; i < NUMBER_TESTS; i++) {

            let index = Math.floor(Math.random() * NUMBER_ADDRESSES);

            let address = addresses[index];

            let value = Math.floor( Math.random() * WebDollarCoins.MAX_SAFE_COINS / 1000 );

            tests.push({
                address:address,
                value: value,
            });

            sumTotal += value;
        }


        for (let i=0; i<tests.length; i++)
            Tree1.updateAccount(tests[i].address, tests[i].value);

        for (let i=tests.length-1; i>=0; i--)
            Tree2.updateAccount(tests[i].address, tests[i].value);


        let sumAddress = (address)=>{

            let sum = 0;

            for (let i=0; i<tests.length; i++)
                if (tests[i].address === address)
                    sum += tests[i].value;

            return sum;
        };

        for (let i = 0; i < tests.length; i++)
            assert( Tree1.getBalance( tests[i].address ) === sumAddress(tests[i].address), " balance value is not equal: " + Tree1.getBalance( tests[i].address ) + "  " + sumAddress(tests[i].address) );


        for (let i = tests.length-1; i >= 0 ; i-- )
            assert( Tree1.getBalance( tests[i].address ) === sumAddress(tests[i].address), " balance value is not equal: " + Tree1.getBalance( tests[i].address ) + "  " + sumAddress(tests[i].address) );

        assert(!Tree1.root.hash.equals(new Buffer(32)), "root hash is not valid "+Tree1.root.hash.toString("hex"));

        let response = await Tree1.saveMiniAccountant(true, "MiniBlockchainAccountantTree.test");
        assert(response === true, 'save miniblockchain accountant tree : ' + response);

        let Tree1_2 = new MiniBlockchainAccountantTree(Blockchain.blockchain.db);
        response = await Tree1_2.loadMiniAccountant(undefined, undefined, true, "MiniBlockchainAccountantTree.test");
        assert(response === true, 'load miniblockchain accountant tree: ' + response);


        response = await Tree2.saveMiniAccountant(true, "MiniBlockchainAccountantTree.test");
        assert(response === true, 'save miniblockchain accountant tree : ' + response);

        let Tree2_2 = new MiniBlockchainAccountantTree( Blockchain.blockchain.db );
        response = await Tree2_2.loadMiniAccountant(undefined, undefined, true, "MiniBlockchainAccountantTree.test");
        assert(response === true, 'load miniblockchain accountant tree: ' + response);


        assert(Tree1_2.root.hash.equals(Tree1.root.hash), " root hash is not the same: " +Tree1_2.root.hash.toString("hex")+"  "+Tree1.root.hash.toString("hex"));
        assert(Tree2_2.root.hash.equals(Tree2.root.hash), " root hash is not the same: " +Tree2_2.root.hash.toString("hex")+"  "+Tree2.root.hash.toString("hex"));


        for (let i = 0; i < tests.length; i++)
            assert( Tree1.getBalance( tests[i].address ) === Tree2.getBalance( tests[i].address ), " balance value is not equal: " + Tree2.getBalance( tests[i].address ) + "  " + Tree1.getBalance( tests[i].address ) );

        assert(Tree2.root.hash.equals(Tree1.root.hash), " HASHES ARE NOT THE SAME: " +Tree1.root.hash.toString("hex")+"  "+Tree2.root.hash.toString("hex"));


        assert(Tree1.calculateNodeCoins() === sumTotal, "Sums are not Equals "+" "+ Tree1.calculateNodeCoins().toString() +" "+sumTotal.toString()+" ");
        assert(Tree2.calculateNodeCoins() === sumTotal, "Sums are not Equals "+" "+ Tree2.calculateNodeCoins().toString() +" "+sumTotal.toString()+" ");
    });


});
