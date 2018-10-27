import NodesList from 'node/lists/Nodes-List';
import consts from "consts/const_global"
import TransactionsPendingQueue from "../pending/Transactions-Pending-Queue";
import Blockchain from "../../../../../main-blockchain/Blockchain";

const MAX_TRANSACTIONS_LENGTH = 5000;

class TransactionsDownloadManager{

    constructor(blockchain, transactionsProtocol){

        this.blockchain = blockchain;
        this.transactionsProtocol = transactionsProtocol;

        this._socketsQueue = [];
        this._transactionsQueue = {};
        this._transactionsQueueLength = 0;

        NodesList.emitter.on("nodes-list/disconnected", (result) => {
            this._unsubscribeSocket(result.socket)
        });

        setTimeout( this._processSockets.bind(this), 5000 );
        setTimeout( this._processTransactions.bind(this), 2*1000 );
        setTimeout( this._deleteOldTransactions.bind(this), 10*1000 );

    }

    findSocket(socket, returnPos = false){

        for (let i=0; i<this._socketsQueue.length; i++)
            if (this._socketsQueue[i] === socket)
                return returnPos ? i :  this._socketsQueue[i];

        return returnPos ? -1 : null;
    }

    addSocket(socket){

        if (this.findSocket(socket) === null)
            this._socketsQueue.push(socket);

    }

    findTransactionById(txId){

        return this._transactionsQueue[txId] ? this._transactionsQueue[txId] : null;

    }

    addTransaction(socket, txId, buffer){

        if ( !Buffer.isBuffer(txId) ) throw {message: "txId is not a buffer"};

        if (this._transactionsQueueLength > MAX_TRANSACTIONS_LENGTH){
            console.warn("There are way too many transactions in pending");
            return false;
        }

        if ( Blockchain.blockchain.transactions.pendingQueue.findPendingTransaction( txId ) !== null )
            return true;

        let transactionFound = this.findTransactionById(txId);
        if ( transactionFound  === null) {

            this._transactionsQueue[txId]= {
                buffer: buffer,
                socket: socket,
                dateInitial: new Date().getTime(),
            };

            this._transactionsQueueLength++;

            return true;

        }else
            transactionFound.socket = socket;

        return false;
    }

    removeTransaction(tx){
        delete this._transactionsQueue[tx];
        this._transactionsQueueLength--;
    }

    async _processSockets(){

        try{

            for (let i=0; i < 20; i++){

                let socket = this._socketsQueue[ Math.floor( Math.random()*this._socketsQueue.length) ];
                await this.transactionsProtocol.downloadTransactions(socket, 0, 40, consts.SETTINGS.MEM_POOL.MAXIMUM_TRANSACTIONS_TO_DOWNLOAD );

            }

        } catch (exception){

        }

        setTimeout( this._processSockets.bind(this), 2000 );

    }

    _findFirstUndeletedTransaction(socketsAlready = []){

        let index = 0;

        for (let txId in this._transactionsQueue){

            index ++;

            if ( !this._transactionsQueue[txId].deleted && this._transactionsQueue[txId].socket !== undefined ) {

                let found = false;
                for ( let j=0; j < socketsAlready.length; j++ )
                    if (socketsAlready[j] === this._transactionsQueue[txId].socket){
                        found = true;
                        break;
                    }

                if (found)
                    continue;

                return {id:txId, index: index};

            }

        }

        return undefined;

    }

    async _processTransactions(){

        let socketsAlready = [];
        for (let count = 0; count < 20; count++){

            try{

                let firstUneleted = this._findFirstUndeletedTransaction(socketsAlready);
                let txId = undefined;

                if(typeof firstUneleted === 'object')
                    txId = firstUneleted.id;

                if (txId !== undefined) {

                    let transaction;

                    try {

                        if ( this._transactionsQueue[txId].buffer === undefined )
                            this._transactionsQueue[txId].buffer = await this.transactionsProtocol.downloadTransaction(this._transactionsQueue[txId].socket, txId);

                        if (Buffer.isBuffer(this._transactionsQueue[txId].buffer))
                            transaction = this._createTransaction(this._transactionsQueue[txId].buffer, this._transactionsQueue[txId].socket);

                    } catch (exception){

                        console.error("Transaction " + txId.toString("hex") + " not downloaded");

                    }

                    console.info("processing transaction ", firstUneleted.index, "/", this._transactionsQueueLength, this._transactionsQueue[txId].buffer ? "Correct" : "Incorrect",  );

                    this._transactionsQueue[txId].deleted = true;
                    this._transactionsQueue[txId].buffer = undefined;

                    if (this._transactionsQueue[txId].socket !== undefined)
                        socketsAlready.push( this._transactionsQueue[txId].socket );

                }

            } catch (exception){
                console.error("_processTransactions raised an error", exception);
            }

        }

        setTimeout( this._processTransactions.bind(this), 300);

    }

    _deleteOldTransactions(){

        let date = new Date().getTime();

        try {

            for (let txId in this._transactionsQueue)
                if ( date - this._transactionsQueue[txId].dateInitial > 10*1000 && this._transactionsQueue[txId].deleted )
                    this.removeTransaction(txId);

        } catch (exception){
            console.error("_deleteOldTransactions raised an error", exception);
        }

        setTimeout( this._deleteOldTransactions.bind(this), 10*1000 );
    }

    _createTransaction(buffer, socket){

        let transaction;
        try {

            transaction = this.blockchain.transactions._createTransactionFromBuffer( buffer ).transaction;

            if (!this.blockchain.mining.miningTransactionSelector.validateTransaction(transaction))
                throw {message: "validation failed"};

            var blockValidationType = {};
            blockValidationType['skip-validation-transactions-from-values'] = true;

            if (!transaction.isTransactionOK(true, false, blockValidationType))  //not good
                throw {message: "transaction is invalid"};

            this.blockchain.transactions.pendingQueue.includePendingTransaction(transaction, socket, true);

            return transaction
        } catch (exception) {

            if (transaction !== undefined && transaction !== null)
                if (this.blockchain.transactions.pendingQueue.findPendingTransaction(transaction.txId) === null)
                    transaction.destroyTransaction();

        }

        return null;

    }

    _unsubscribeSocket(socket){

        for (let i = this._socketsQueue.length-1; i >= 0; i--)
            if (this._socketsQueue[i] === socket)
                this._socketsQueue.splice(i, 1);

        for (let txId in this._transactionsQueue)
            if ( this._transactionsQueue[txId].socket === socket )
                this._transactionsQueue[txId].socket = undefined;

    }

}

export default TransactionsDownloadManager;