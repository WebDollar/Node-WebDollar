import NodesList from 'node/lists/Nodes-List';
import consts from "consts/const_global"
import TransactionsPendingQueue from "../pending/Transactions-Pending-Queue";
import Blockchain from "../../../../../main-blockchain/Blockchain";

const MAX_TRANSACTIONS_LENGTH = 5000;

class TransactionsDownloadManager{

    constructor(blockchain, transactionsProtocol){

        this.blockchain = blockchain;
        this.transactionsProtocol = transactionsProtocol;

        this._socketsQueue = {};
        this._socketsQueueLength = 0;
        this._transactionsQueue = {};
        this._transactionsQueueLength = 0;

        NodesList.emitter.on("nodes-list/disconnected", (result) => {
            this._unsubscribeSocket(result.socket)
        });

        setTimeout( this._processSockets.bind(this), 5000 );
        setTimeout( this._processTransactions.bind(this), 2*1000 );
        setTimeout( this._removeOldTransactions.bind(this), 20*1000);

    }

    removeTransaction(tx){
        delete this._transactionsQueue[tx];
        this._transactionsQueueLength--;
    }

    createTransaction(txId,socket,buffer){
        this._transactionsQueue[txId]= { buffer: buffer, socket: [socket], totalSocketsProcessed: 0, skipeTx: false, dateInitial: new Date().getTime() };
        this._transactionsQueueLength++;
    }

    addSocket(socket){
        this._socketsQueue[socket.node.sckAddress.uuid] = socket;
        this._socketsQueueLength++;
    }

    removeSocket(socket){
        delete this._socketsQueue[socket.node.sckAddress.uuid];
        this._socketsQueueLength--;
    }

    findTransactionById(txId){
        return this._transactionsQueue[txId] ? this._transactionsQueue[txId] : null;
    }

    findFirstReadyToDownloadTransaction(){

        let index = 0;

        for (let txId in this._transactionsQueue){

            index ++;

            if ( this._transactionsQueue[txId].socket !== undefined && this._transactionsQueue[txId].skipeTx !== true )
                return {id:txId, index: index, };
            else
                this.removeTransaction(txId);

        }

        return undefined;

    }

    addTransaction(socket, txId, buffer){

        if ( !Buffer.isBuffer(txId) )
            throw {message: "txId is not a buffer"};

        if (this._transactionsQueueLength > MAX_TRANSACTIONS_LENGTH){
            console.warn("There are way too many transactions in pending");
            return false;
        }

        if ( Blockchain.blockchain.transactions.pendingQueue.findPendingTransaction( txId.toString('hex') ) !== null )
            return true;

        if ( this.findTransactionById(txId.toString('hex')) === null) {

            this.createTransaction(txId.toString('hex'),socket,buffer);
            return true;

        }else{

            let found = false;

            //Add socket in socketsList if is from different socket
            for( let i=0; i<this._transactionsQueue[txId.toString('hex')].socket.length; i++){

                if( this._transactionsQueue[txId.toString('hex')].socket.length !==0 )
                    if( this._transactionsQueue[txId.toString('hex')].socket[i].node.sckAddress.uuid === socket.node.sckAddress.uuid ){
                        this._transactionsQueue[txId.toString('hex')].skipeTx=false;
                        found = true;
                        break;
                    }

            }

            if( found===false ){
                this._transactionsQueue[txId.toString('hex')].socket.push(socket);
            }

        }

        return false;
    }

    async _processSockets(){

        try{

            let randomSocket;

            if(this._socketsQueueLength > 0)
                randomSocket = Object.keys( this._socketsQueue )[ Math.floor( Math.random()*this._socketsQueueLength ) ];
            await this.transactionsProtocol.downloadTransactions( this._socketsQueue[randomSocket], 0, 40, consts.SETTINGS.MEM_POOL.MAXIMUM_TRANSACTIONS_TO_DOWNLOAD );

        } catch (exception){

        }

        setTimeout( this._processSockets.bind(this), 2000 );

    }

    async _processTransactions() {

        for (let i = 0; i <= 20; i++){

            try {

                let firstUneleted = this.findFirstReadyToDownloadTransaction();
                let txId = undefined;

                if (typeof firstUneleted === 'object')
                    txId = firstUneleted.id;

                if (txId !== undefined) {

                    try {

                        let totalSocketsProcessed = this._transactionsQueue[txId].totalSocketsProcessed;

                        //Try to download transaction by hash
                        if (this._transactionsQueue[txId].buffer === undefined)
                            this._transactionsQueue[txId].buffer = await this.transactionsProtocol.downloadTransaction(this._transactionsQueue[txId].socket[totalSocketsProcessed], Buffer.from(txId, 'hex'));

                        console.info("processing transaction ", this._transactionsQueueLength, this._transactionsQueue[txId].buffer ? "Correct" : "Incorrect",);
                        // await this.sleep(100);

                        //If transaction was downloaded
                        if (Buffer.isBuffer(this._transactionsQueue[txId].buffer)) {
                            this._createTransaction(this._transactionsQueue[txId].buffer, this._transactionsQueue[txId].socket[totalSocketsProcessed]);
                            this._transactionsQueue[txId].skipeTx = true;
                        }

                    } catch (exception) {

                        console.error("No tx found");

                    }

                    this._transactionsQueue[txId].totalSocketsProcessed++;

                    if (this._transactionsQueue[txId].socket.length <= this._transactionsQueue[txId].totalSocketsProcessed){
                        this._transactionsQueue[txId].skipeTx = true;
                        this._transactionsQueue[txId].buffer = undefined;
                    }

                }

            } catch (exception) {
                console.error("_processTransactions raised an error", exception);
            }

        }

        setTimeout( this._processTransactions.bind(this), 1000);

    }

    _createTransaction(buffer, socket){

        let transaction;

        try {

            transaction = this.blockchain.transactions._createTransactionFromBuffer( buffer ).transaction;

            if (!this.blockchain.mining.miningTransactionSelector.validateTransaction(transaction))
                throw {message: "Transsaction validation failed"};

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

    _removeOldTransactions(){

        for( let txId in this._transactionsQueue )
            if( this._transactionsQueue[txId].skipeTx === true )
                delete this._transactionsQueue[txId];

        setTimeout( this._removeOldTransactions.bind(this), 15*60*1000);

    }

    _unsubscribeSocket(socket){

        this.removeSocket(socket);

        for (let txId in this._transactionsQueue)
            for( let i =0; i<this._transactionsQueue[txId].socket.length; i++)
                if ( this._transactionsQueue[txId].socket[i] === socket )
                    this._transactionsQueue[txId].socket.splice(i,1);

    }

}

export default TransactionsDownloadManager;