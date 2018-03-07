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

            let transaction = new InterfaceTransaction(
                {addresses: {unencodedAddress: address, publicKey: 666}, currency: currency},
                {addresses: {unencodedAddress: toAddress, amount: toAmount}, fee: fee}, undefined, undefined, undefined);

            let signature = address.signTransaction(transaction, password);

            this.pendingQueue.includePendingTransaction(transaction);

            return {
                result: true,
                signature: signature
            }

        } catch (exception){

            return {
                result:false,
                message: exception.toString()
            }

        }
    }

    calculateFeeSimple(toAmount){

        if (toAmount < 0)
            return 0;

        return Math.min( Math.floor (0.1 * toAmount) + 1, 10 );

    }




}

export default InterfaceBlockchainTransactions;