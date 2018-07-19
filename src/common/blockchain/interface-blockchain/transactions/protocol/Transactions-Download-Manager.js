import NodesList from 'node/lists/Nodes-List';
import consts from "consts/const_global"

const MAX_TRANSACTIONS_LENGTH = 5000;

class TransactionsDownloadManager{

    constructor(blockchain, transactionsProtocol){

        this.blockchain = blockchain;
        this.transactionsProtocol = transactionsProtocol;

        this._socketsQueue = [];
        this._transactionsQueue = [];

        NodesList.emitter.on("nodes-list/disconnected", (result) => {
            this._unsubscribeSocket(result.socket)
        });

        setTimeout( this._processSockets.bind(this), 5000 );
        setTimeout( this._processTransactions.bind(this), 5000 );

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

    findTransactionById(txId, returnPos){

        for (let i=0; i<this._transactionsQueue.length; i++)
            if (this._transactionsQueue[i].txId.equals(txId))
                return returnPos ? i :  this._transactionsQueue[i];

        return returnPos ? -1 : null;

    }

    addTransaction(socket, txId, buffer){

        if ( !Buffer.isBuffer(txId) ) throw {message: "txId is not a buffer"};

        if (this._transactionsQueue.length > MAX_TRANSACTIONS_LENGTH){
            console.warn("There are way too many transactions in pending");
            return false; //too many;
        }

        if (this.findTransactionById(txId) === null) {
            this._transactionsQueue.push({
                txId: txId,
                buffer: buffer,
                socket: socket
            });
            return true;
        }

        return false;
    }

    async _processSockets(){

        let socket;
        if (this._socketsQueue.length > 0){
            socket = this._socketsQueue[0];
            this._socketsQueue.splice(0,1);
        }

        if (socket !== undefined)
            await this.transactionsProtocol.downloadTransactions(socket, 0, 40, consts.SETTINGS.MEM_POOL.TRANSACTIONS_MAXIMUM_DOWNLOADS );

        setTimeout( this._processSockets.bind(this), 3000 );

    }


    async _processTransactions(){

        let tx;
        if (this._transactionsQueue.length > 0){
            tx = this._transactionsQueue[0];
            this._transactionsQueue.splice(0,1);
        }

        if (tx !== undefined) {

            if (tx.buffer === undefined)
                tx.buffer = await this.transactionsProtocol.downloadTransaction(tx.socket, tx.txId );

            let transaction;
            if (Buffer.isBuffer(tx.buffer))
                transaction = this._createTransaction(tx.buffer, tx.socket);


        }


        setTimeout( this._processTransactions.bind(this), 3000 );

    }

    _createTransaction(buffer, socket){

        try {

            let transaction = this.blockchain.transactions._createTransactionFromBuffer( buffer ).transaction;

            if (!this.blockchain.mining.miningTransactionSelector.validateTransaction(transaction))
                throw {message: "validation failed"};

            if (!transaction.isTransactionOK(true, false))  //not good
                throw {message: "transaction is invalid"};

            this.blockchain.transactions.pendingQueue.includePendingTransaction(transaction, socket);

            return transaction
        } catch (exception) {

        }

        return null;

    }

    _unsubscribeSocket(socket){

        for (let i = this._socketsQueue.length; i>= 0; i--)
            if (this._socketsQueue[i] === socket){
                this._socketsQueue.splice(i, 1);
                return;
            }

    }

}

export default TransactionsDownloadManager;