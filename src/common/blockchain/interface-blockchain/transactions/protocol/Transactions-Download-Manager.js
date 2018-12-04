import NodesList from 'node/lists/Nodes-List';
import consts from "consts/const_global"
import NodesList from 'node/lists/Nodes-List'

const MAX_TRANSACTIONS_LENGTH = 5000;

class TransactionsDownloadManager{

    constructor(blockchain, transactionsProtocol){

        this.blockchain = blockchain;
        this.transactionsProtocol = transactionsProtocol;

        this._socketsQueue = [];
        this._transactionsQueue = [];

        NodesList.emitter.on("nodes-list/connected", async (nodesListObject) => {
            nodesListObject.socket.node.protocol.transactionsDownloadingManager = {penaltyPoints: 0};
        });

        NodesList.emitter.on("nodes-list/disconnected", (result) => {
            this._unsubscribeSocket(result.socket)
        });

        setTimeout( this._processSockets.bind(this), 5000 );
        setTimeout( this._processTransactions.bind(this), 2*1000 );
        setTimeout( this._deleteOldTransactions.bind(this), 2*60*1000 );
        setTimeout( this._clearBannedList.bind(this), 30*1000 );

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

        let transactionFound = this.findTransactionById(txId);
        if ( transactionFound  === null) {

            this._transactionsQueue.push({
                txId: txId,
                buffer: buffer,
                socket: socket,
                dateInitial: new Date().getTime(),
                deleted: false,
            });

            return true;

        } else {

            transactionFound.socket = socket;

        }

        return false;
    }

    async _processSockets(){

        try{

            for (let i=0; i < 10; i++){

                let socket;
                if (this._socketsQueue.length > 0) {
                    socket = this._socketsQueue[0];
                    this._socketsQueue.splice(0,1);
                }

                if (socket !== undefined)
                    await this.transactionsProtocol.downloadTransactions(socket, 0, 40, consts.SETTINGS.MEM_POOL.MAXIMUM_TRANSACTIONS_TO_DOWNLOAD );

            }

        } catch (exception){

        }

        setTimeout( this._processSockets.bind(this), 2000 );

    }

    _findFirstUndeletedTransaction(){

        for (let i=0; i < this._transactionsQueue.length; i++)
            if ( !this._transactionsQueue[i].deleted && this._transactionsQueue[i].socket !== undefined && (this._transactionsQueue[i].socket.node.protocol.transactionsDownloadingManager.penaltyPoints < 10) )
                return i;


        return -1;

    }

    async _processTransactions(){

        try{

            let pos = this._findFirstUndeletedTransaction();

            let tx;
            if (pos !== -1)
                tx = this._transactionsQueue[pos];

            if (tx !== undefined) {

                console.info("processing transaction ", pos, "/", this._transactionsQueue.length, tx.txId.toString("hex"));

                let transaction;

                try {

                    if ( tx.buffer === undefined )
                        tx.buffer = await this.transactionsProtocol.downloadTransaction(tx.socket, tx.txId );

                    if (Buffer.isBuffer(tx.buffer))
                        transaction = this._createTransaction(tx.buffer, tx.socket);

                } catch (exception){

                }

                if (transaction === undefined || transaction === null)
                    this._increaseSocketPenalty(tx.socket);

                tx.deleted = true;
                delete tx.buffer;

            }

        } catch (exception){
            console.error("_processTransactions raised an error", exception);
        }


        setTimeout( this._processTransactions.bind(this), 800);

    }

    _increaseSocketPenalty(socket){

        if (socket === undefined) return;

        socket.node.protocol.transactionsDownloadingManager.penaltyPoints += 2;

        if ( socket.node.protocol.transactionsDownloadingManager.penaltyPoints >= 10 )
            socket.node.protocol.transactionsDownloadingManager.penaltyDate = new Date().getTime();

    }

    _deleteOldTransactions(){

        let date = new Date().getTime();

        try {

            for (let i = this._transactionsQueue.length - 1; i >= 0; i--)
                if ( (date - this._transactionsQueue[i].dateInitial) > 1 * 60 * 60 * 1000 )
                    this._transactionsQueue.splice(i, 1);

        } catch (exception){
            console.error("_deleteOldTransactions raised an error", exception);
        }

        setTimeout( this._deleteOldTransactions.bind(this), 2*60*1000 );
    }

    _createTransaction(buffer, socket){

        let transaction;
        try {

            transaction = this.blockchain.transactions._createTransactionFromBuffer( buffer ).transaction;

            if (!this.blockchain.mining.miningTransactionSelector.validateTransaction(transaction))
                throw {message: "validation failed"};

            if (!transaction.isTransactionOK(true, false))  //not good
                throw {message: "transaction is invalid"};

            this.blockchain.transactions.pendingQueue.includePendingTransaction(transaction, socket);

            return transaction

        } catch (exception) {

            if (transaction !== undefined && transaction !== null)
                if (this.blockchain.transactions.pendingQueue.findPendingIdenticalTransaction(transaction) === -1)
                    this.blockchain.transactions.pendingQueue._removePendingTransaction(transaction, true);

        }

        return null;

    }

    _unsubscribeSocket(socket){

        for (let i = this._socketsQueue.length-1; i >= 0; i--)
            if (this._socketsQueue[i] === socket)
                this._socketsQueue.splice(i, 1);

        for (let i=this._transactionsQueue.length-1; i  >= 0; i--)
            if ( this._transactionsQueue[i].socket === socket) {
                this._transactionsQueue[i].socket = undefined;

                // if (!this._transactionsQueue[i].deleted) {
                //     this._transactionsQueue[i].deleted = true;
                //     this._transactionsQueue.splice(i, 1);
                // }

            }

    }

    _clearBannedList(){

        try{

            for (let i=0; i<NodesList.nodes.length; i++) {

                //console.log(NodesList.nodes[i].socket.node.protocol.transactionsDownloadingManager.penaltyPoints);
                //console.log(new Date().getTime() - NodesList.nodes[i].socket.node.protocol.transactionsDownloadingManager.penaltyDate);

                if (NodesList.nodes[i].socket.node.protocol.transactionsDownloadingManager.penaltyPoints >= 10 && (new Date().getTime() - NodesList.nodes[i].socket.node.protocol.transactionsDownloadingManager.penaltyDate) > 30 * 1000) {
                    NodesList.nodes[i].socket.node.protocol.transactionsDownloadingManager.penaltyDate = new Date().getTime();
                    NodesList.nodes[i].socket.node.protocol.transactionsDownloadingManager.penaltyPoints--;
                }
            }

        } catch (exception){

        }



        setTimeout( this._clearBannedList.bind(this), 30*1000 );
    }

}

export default TransactionsDownloadManager;