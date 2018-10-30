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
        this.list = {};
        this.listArray = [];

        this.db = db;

        setTimeout( this._removeOldTransactions.bind(this), 20000 );

    }

    includePendingTransaction (transaction, exceptSockets, avoidValidation = false){

        if ( this.findPendingTransaction(transaction.txId) !== null )
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

        this.propagateTransaction(transaction, exceptSockets);

        return true;

    }

    _insertPendingTransaction(transaction){

        let inserted = false;

        for (let i=0; i<this.listArray.length ; i++ ) {

            let compare = transaction.from.addresses[0].unencodedAddress.compare(this.listArray[i].from.addresses[0].unencodedAddress);

            if (compare < 0) // next
                continue;
            else
            if (compare === 0){ //order by nonce

                if (transaction.nonce === this.listArray[i].nonce){
                    inserted = true;
                    break;
                } else if (transaction.nonce < this.listArray[i].nonce){
                    this.listArray.splice(i, 0, transaction);
                    this.list[transaction.txId.toString('hex')] = transaction;
                    inserted = true;
                    break;
                }

            }
            else
            if (compare > 0) { // i will add it
                this.listArray.splice(i, 0, transaction);
                this.list[transaction.txId.toString('hex')] = transaction;
                inserted = true;
                break;
            }

        }

        if ( inserted === false){
            this.listArray.push(transaction);
            this.list[transaction.txId.toString('hex')] = transaction;
        }

        console.warn("Transactions stack -", this.listArray.length);

        transaction.confirmed = false;
        transaction.pendingDateBlockHeight = this.blockchain.blocks.length-1;
        
        this.transactions.emitTransactionChangeEvent( transaction );

    }

    findPendingTransaction(txId){

        return this.list[txId.toString('hex')] ? this.list[txId.toString('hex')] : null;

    }

    _removePendingTransaction (transaction, index){

        if (index === null)
            return true;

        this.list[transaction.txId.toString('hex')].destroyTransaction();

        delete this.list[transaction.txId.toString('hex')];

        this.listArray.splice(index, 1);

        this.transactions.emitTransactionChangeEvent(transaction, true);
    }

    _removeOldTransactions (){

        let blockValidationType = {
            "take-transactions-list-in-consideration": {
                validation: true
            }
        };

        for (let i=this.listArray.length-1; i >= 0; i--) {

            if (this.listArray[i].from.addresses[0].unencodedAddress.equals( this.blockchain.mining.unencodedMinerAddress )) continue;

            if ( this.blockchain.blocks.length - consts.BLOCKCHAIN.FORKS.IMMUTABILITY_LENGTH > this.listArray[i].timeLock && this.listArray[i].timeLock + consts.BLOCKCHAIN.FORKS.IMMUTABILITY_LENGTH < this.blockchain.blocks.length ){
                this._removePendingTransaction(this.listArray[i], i);
                continue;
            }

            try{

                if ( Blockchain.blockchain.agent.consensus )
                    this.listArray[i].validateTransactionEveryTime(undefined, blockValidationType );

            } catch (exception){

                if ( !exception.myNonce || Math.abs( exception.myNonce - exception.nonce) > consts.SPAM_GUARDIAN.MAXIMUM_DIFF_NONCE_ACCEPTED_FOR_QUEUE )
                    this._removePendingTransaction(this.listArray[i], i)

            }

        }

        setTimeout( this._removeOldTransactions.bind(this), 20000 );

    }

    propagateTransaction(transaction, exceptSocket){
        this.transactionsProtocol.propagateNewPendingTransaction(transaction, exceptSocket)
    }


}

export default TransactionsPendingQueue