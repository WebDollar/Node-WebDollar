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

        this.smallestTrial = 0;

        NodesList.emitter.on("nodes-list/disconnected", (result) => {
            this._unsubscribeSocket(result.socket)
        });

        NodesList.emitter.on("nodes-list/connected", (result) => {
            this.addSocket(result.socket)
        });

        setTimeout( this._processSocket.bind(this), 10*1000 );
        setTimeout( this._processTransactions.bind(this), 2*1000 );

    }

    removeTransaction(tx){
        delete this._transactionsQueue[tx];
        this._transactionsQueueLength--;
    }

    createTransaction(txId,socket){
        this._transactionsQueue[txId]= { buffer: undefined, socket: [socket], totalSocketsProcessed: 0, fails:0, lastTrialTime:undefined, dateInitial: new Date().getTime() };
        this._transactionsQueueLength++;
    }

    addSocket(socket){
        socket.downloadFails = 0;
        this._socketsQueue[socket.node.sckAddress.uuid] = socket;
        this._socketsQueueLength++;
        setTimeout( this._processSocket.bind(this,socket.node.sckAddress.uuid), 5000);
    }

    removeSocket(socket){
        delete this._socketsQueue[socket.node.sckAddress.uuid];
        this._socketsQueueLength--;
    }

    findTransactionById(txId){
        return this._transactionsQueue[txId] ? this._transactionsQueue[txId] : null;
    }

    /**
     * This function will find tx avaiable for download and in the same time is cleaning the list
     * **/
    processTransactionsList(){

        let index = 0;
        let foundVirginTransaction = false;
        let foundHighFailedTransaction = false;

        for (let txId in this._transactionsQueue){

            let currentTime = new Date().getTime();

            //Take only the most virgines tx
            if ( this.smallestTrial <= this._transactionsQueue[txId].fails ){

                foundVirginTransaction = true;

                //Check if past 10s from last download trial
                if( currentTime - this._transactionsQueue[txId].lastTrialTime > 1000*10 || this._transactionsQueue[txId].lastTrialTime === undefined ){

                    //Check the maximum fails allowed per transaction hash
                    if( this._transactionsQueue[txId].fails <= 5 ){

                        //Check if tx has socket and is still valid
                        if ( this._transactionsQueue[txId].socket !== undefined )
                            return {id:txId, index: index, };
                        else
                            this.removeTransaction(txId);

                    }else
                        this.removeTransaction(txId);

                }

            }else
                foundHighFailedTransaction = true;

        }

        //If there is any tx to be processed
        if(index!==0){

            //Increase trials limit for processing next time or decrease it
            if(!foundVirginTransaction)
                this.smallestTrial ++;
            else
                if(!foundHighFailedTransaction)
                    this.smallestTrial = this.smallestTrial === 0 ? 0 : this.smallestTrial--;
        }

        return undefined;

    }

    addTransaction(socket, txId){

        if ( !Buffer.isBuffer(txId) )
            throw {message: "txId is not a buffer"};

        if (this._transactionsQueueLength > MAX_TRANSACTIONS_LENGTH){
            console.warn("There are way too many transactions in pending");
            return false;
        }

        if ( Blockchain.blockchain.transactions.pendingQueue.findPendingTransaction( txId.toString('hex') ) !== null )
            return true;

        if ( this.findTransactionById(txId.toString('hex')) === null) {

            this.createTransaction(txId.toString('hex'),socket);
            return true;

        }else{

            let found = false;

            //Add socket in tx socketsList if is from different socket
            for( let i=0; i<this._transactionsQueue[txId.toString('hex')].socket.length; i++){

                if( this._transactionsQueue[txId.toString('hex')].socket[i].node !== undefined )
                    if( this._transactionsQueue[txId.toString('hex')].socket[i].node.sckAddress.uuid === socket.node.sckAddress.uuid ){

                        found = true;

                        let socket1 = this._transactionsQueue[txId.toString('hex')].socket[i];
                        let socket2 = socket;

                        delete socket1.downloadFails;
                        delete socket2.downloadFails;

                        if( this._transactionsQueue[txId.toString('hex')].socket[i] !== socket )
                            found = false;

                        break;
                    }

            }

            if( found===false )
                this._transactionsQueue[txId.toString('hex')].socket.push(socket);


        }

        return false;
    }

    async _processSocket(socketID=undefined){

        console.warn("Process Socket");

        try{

            let selectedSocket;

            if(socketID){

                selectedSocket = socketID;
                
            }else{

                //Select random socket for being processed
                let randomSocketIndex = Math.floor( Math.random()*this._socketsQueueLength );
                randomSocketIndex = randomSocketIndex-1 >= 0 ? randomSocketIndex-1 : 0;
                selectedSocket = Object.keys( this._socketsQueue )[ randomSocketIndex ];
                
            }

            if(this._socketsQueueLength > 0)
                await this.transactionsProtocol.downloadTransactions( this._socketsQueue[selectedSocket], 0, 40, consts.SETTINGS.MEM_POOL.MAXIMUM_TRANSACTIONS_TO_DOWNLOAD );

        } catch (exception){

            console.warn("Faield to process socket");

        }

        // setTimeout( this._processSocket.bind(this), 40*1000);

    }

    async _processTransactions() {

        for (let i = 0; i <= 20; i++){

            try {

                let firstUneleted = this.processTransactionsList();
                let txId = undefined;
                let found = false;

                if (typeof firstUneleted === 'object')
                    txId = firstUneleted.id;

                if (txId !== undefined) {

                    try {

                        let totalSocketsProcessed = this._transactionsQueue[txId].totalSocketsProcessed;

                        //Try to download transaction by hash
                        this._transactionsQueue[txId].buffer = await this.transactionsProtocol.downloadTransaction(this._transactionsQueue[txId].socket[totalSocketsProcessed], Buffer.from(txId, 'hex'));

                        await this.blockchain.sleep(20);
                        console.info("Processing tx ",this._transactionsQueue[txId].buffer ? "SUCCEED, from" : "FAILED, from", totalSocketsProcessed, "-", this._transactionsQueue[txId].socket.length, txId.toString('hex'), "-", this._transactionsQueueLength-1, "tx left to be processed for now",);

                        let wasAdded = null;

                        //If transaction was downloaded
                        if (Buffer.isBuffer(this._transactionsQueue[txId].buffer)) {

                            wasAdded = this._createTransaction(this._transactionsQueue[txId].buffer, this._transactionsQueue[txId].socket[totalSocketsProcessed]);
                            found = true;

                            if( typeof this._transactionsQueue[txId].socket[totalSocketsProcessed].node !== "undefined" )
                                this._socketsQueue[this._transactionsQueue[txId].socket[totalSocketsProcessed].node.sckAddress.uuid].downloadFails =
                                    this._socketsQueue[this._transactionsQueue[txId].socket[totalSocketsProcessed].node.sckAddress.uuid].downloadFails-1 > 0 ?
                                        this._socketsQueue[this._transactionsQueue[txId].socket[totalSocketsProcessed].node.sckAddress.uuid].downloadFails-1 : 0;

                            this.removeTransaction(txId);

                        }else{
                            this._transactionsQueue[txId].fails++;
                            this._transactionsQueue[txId].lastTrialTime = new Date().getTime();

                            if( typeof this._transactionsQueue[txId].socket[totalSocketsProcessed].node !== "undefined" )
                                this._socketsQueue[this._transactionsQueue[txId].socket[totalSocketsProcessed].node.sckAddress.uuid].downloadFails++;

                            if( this._socketsQueue[this._transactionsQueue[txId].socket[totalSocketsProcessed].node.sckAddress.uuid].downloadFails > 20 )
                                this._unsubscribeSocket(this._transactionsQueue[txId].socket[totalSocketsProcessed].node.sckAddress.uuid);
                        }

                        // if(wasAdded !== null)
                            //TODO ban socket

                    } catch (exception) {

                        console.error("No tx found");

                    }

                    if(!found){
                        this._transactionsQueue[txId].totalSocketsProcessed++;

                        //If already processed all tx sockets start again until will be removed
                        if (this._transactionsQueue[txId].socket.length === this._transactionsQueue[txId].totalSocketsProcessed-1)
                            this._transactionsQueue[txId].totalSocketsProcessed=0;
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

    _unsubscribeSocket(socket){

        this.removeSocket(socket);

        for (let txId in this._transactionsQueue)
            for( let i =0; i<this._transactionsQueue[txId].socket.length; i++)
                if ( this._transactionsQueue[txId].socket[i] === socket )
                    this._transactionsQueue[txId].socket.splice(i,1);

    }

}

export default TransactionsDownloadManager;