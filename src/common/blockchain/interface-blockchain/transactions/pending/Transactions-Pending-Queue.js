import consts from 'consts/const_global'
import BufferExtended from "common/utils/BufferExtended"
import TransactionsProtocol from "../protocol/Transactions-Protocol"
import TransactionsPendingQueueSavingManager from "./Transactions-Pending-Queue-Saving-Manager";
import Blockchain from "../../../../../main-blockchain/Blockchain";

class TransactionsPendingQueue {

    constructor(transactions, blockchain, db){

        this.transactionsProtocol = new TransactionsProtocol(blockchain);

        this.transactions = transactions;
        this.pendingQueueSavingManager = new TransactionsPendingQueueSavingManager(blockchain, this, db);

        this.blockchain = blockchain;
        this.list = [];

        this.db = db;


        setTimeout( this._removeOldTransactions.bind(this), 20000 );

    }

    includePendingTransaction (transaction, exceptSockets, avoidValidation = false){

        if ( this.findPendingTransaction(transaction) !== -1 )
            return false;

        let blockValidationType = {
            "take-transactions-list-in-consideration": {
                validation: true
            }
        };

        if (!avoidValidation)
            if (!transaction.validateTransactionOnce(this.blockchain.blocks.length-1, blockValidationType ))
                return false;

        this._insertPendingTransaction(transaction);

        this.transactionsProtocol.transactionsForPropagation.addTransactionForPropagationList(transaction, avoidValidation);
        this.propagateTransaction(transaction, exceptSockets);

        return true;

    }

    _insertPendingTransaction(transaction){

        let inserted = false;

        for (let i=0; i<this.list.length && inserted === false; i++ ) {

            let compare = transaction.from.addresses[0].unencodedAddress.compare(this.list[i].from.addresses[0].unencodedAddress);

            if (compare < 0) // next
                continue;
            else
            if (compare === 0){ //order by nonce


                if (transaction.nonce === this.list[i].nonce){
                    inserted = true;
                    break;
                } else if (transaction.nonce < this.list[i].nonce){
                    this.list.splice(i, 0, transaction);
                    inserted = true;
                    break;
                }

            }
            else
            if (compare > 0) { // i will add it
                this.list.splice(i, 0, transaction);
                inserted = true;
                break;
            }

        }

        if ( inserted === false)
            this.list.push(transaction);

        transaction.confirmed = false;
        transaction.pendingDateBlockHeight = this.blockchain.blocks.length-1;
        
        this.transactions.emitTransactionChangeEvent( transaction );
    }

    findPendingTransaction(transaction){

        for (let i = 0; i < this.list.length; i++)
            if (  this.list[i].txId.equals( transaction.txId )) //it is not required to use BufferExtended.safeCompare
                return i;

        return -1;
    }

    findPendingIdenticalTransaction(transaction){

        for (let i = 0; i < this.list.length; i++)
            if (  this.list[i] === transaction.txId) //it is not required to use BufferExtended.safeCompare
                return i;

        return -1;
    }

    searchPendingTransactionByTxId(transactionId){

        if (typeof transactionId === "string") transactionId = new Buffer(transactionId, 16);

        for (let i=0; i< this.list.length; i++)
            if (transactionId.equals( this.list[i].txId ))
                return this.list[i];

        return null;
    }

    _removePendingTransaction (transaction, forcedDeletion){

        if (transaction.pendingTransactionsIncluded !== undefined && transaction.pendingTransactionsIncluded !== 0) return; //try next time

        let index;

        if (typeof transaction === "object") index = this.findPendingTransaction(transaction);
        else if (typeof transaction === "number") {
            index = transaction;
            transaction = this.list[index];
        }

        if (index !== -1){

            this.list.splice(index, 1);

        }

        if (transaction !== undefined && transaction !== null) {

            if (!forcedDeletion)
                this.transactions.emitTransactionChangeEvent(transaction, true, index);

            transaction.destroyTransaction();
        }

    }

    _removeOldTransactions (){

        let blockValidationType = {
            "take-transactions-list-in-consideration": {
                validation: true
            }
        };

        for (let i=this.list.length-1; i >= 0; i--) {

            if (this.list[i].blockchain === undefined) {
                this._removePendingTransaction(i, true);
                continue;
            }

            if (this.list[i].from.addresses[0].unencodedAddress.equals( this.blockchain.mining.unencodedMinerAddress )) continue;

            try{

                if ( ( (this.blockchain.blocks.length > this.list[i].pendingDateBlockHeight + consts.SETTINGS.MEM_POOL.TIME_LOCK.TRANSACTIONS_MAX_LIFE_TIME_IN_POOL_AFTER_EXPIRATION) ||  ( Blockchain.blockchain.agent.consensus && !this.list[i].validateTransactionEveryTime(undefined, blockValidationType ))  ) &&
                     (this.list[i].timeLock === 0 || this.list[i].timeLock < this.blockchain.blocks.length - consts.SETTINGS.MEM_POOL.TIME_LOCK.TRANSACTIONS_MAX_LIFE_TIME_IN_POOL_AFTER_EXPIRATION  )) {
                    this._removePendingTransaction(i);
                }

            } catch (exception){

                if ( Math.random() < 0.1)
                    console.warn("Old Transaction removed because of exception ", exception);

                this._removePendingTransaction(i)
            }

        }

        setTimeout( this._removeOldTransactions.bind(this), 20000 );

    }

    propagateTransaction(transaction, exceptSocket){
        this.transactionsProtocol.propagateNewPendingTransaction(transaction, exceptSocket)
    }


}

export default TransactionsPendingQueue