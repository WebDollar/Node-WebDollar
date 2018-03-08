import consts from 'consts/const_global'
import InterfaceTransactionsPendingQueue from './pending/Interface-Transactions-Pending-Queue'
import InterfaceTransactionsUniqueness from './uniqueness/Interface-Transactions-Uniqueness'
import InterfaceTransaction from "./transaction/Interface-Blockchain-Transaction"
import InterfaceSatoshminDB from 'common/satoshmindb/Interface-SatoshminDB'
import InterfaceBlockchainAddressHelper from "common/blockchain/interface-blockchain/addresses/Interface-Blockchain-Address-Helper";
const schnorr = require('schnorr');

class InterfaceBlockchainTransactions {

    constructor( wallet ){

        this.wallet = wallet;

        let db = new InterfaceSatoshminDB(consts.DATABASE_NAMES.TRANSACTIONS_DATABASE);

        this.pendingQueue = new InterfaceTransactionsPendingQueue(db);

        this.uniqueness = new InterfaceTransactionsUniqueness();
    }

    createTransactionSimple(address, toAddress, toAmount, fee, currency, password = undefined){

        try {

            address = this.wallet.getAddress(address);

        } catch (exception){
            console.error("Creating a new transaction raised an exception - Getting Address", exception.toString());
            return { result:false,  message: "Get Address failed", reason: exception.toString() }
        }

        let transaction = undefined;

        try {

            transaction = new InterfaceTransaction(
                {addresses: {unencodedAddress: address, publicKey: 666}, currency: currency},
                {addresses: {unencodedAddress: toAddress, amount: toAmount}, fee: fee}, undefined, undefined,
                false, false
            );

        } catch (exception) {
            console.error("Creating a new transaction raised an exception - Failed Creating a transaction", exception.toString());
            return { result:false,  message: "Failed Creating a transaction", reason: exception.toString() }
        }


        let signature;
        try{
            signature = address.signTransaction(transaction, password);
        } catch (exception){
            console.error("Creating a new transaction raised an exception - Failed Signing the Transaction", exception.toString());
            return { result:false,  message: "Failed Signing the transaction", reason: exception.toString() }
        }

        try{
            transaction.validateFrom();
            transaction.validateTo();
        } catch (exception){
            console.error("Creating a new transaction raised an exception - Failed Validating Transaction", exception.toString());
            return { result:false,  message: "Failed Signing the transaction", reason: exception.toString() }
        }

        try{

            this.pendingQueue.includePendingTransaction(transaction);

        } catch (exception){

            console.error("Creating a new transaction raised an exception - Including Pending Transaction", exception.toString());
            return { result:false,  message: "Including Pending Transaction", reason: exception.toString() }
        }

        return {
            result: true,
            signature: signature
        }
    }

    calculateFeeSimple(toAmount){

        if (toAmount < 0)
            return 0;

        return Math.min( Math.floor (0.1 * toAmount) + 1, 10 );

    }




}

export default InterfaceBlockchainTransactions;