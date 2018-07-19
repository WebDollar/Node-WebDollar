import NodesList from 'node/lists/Nodes-List';

class TransactionsDownloadManager{

    constructor(blockchain){

        this.blockchain = blockchain;

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
                return returnPos ? i :  this._socketsQueue[i];

        return returnPos ? -1 : null;

    }

    addTransaction(socket, txId, buffer){

        if ( !Buffer.isBuffer(txId) ) throw {message: "txId is not a buffer"};

        for (let i=0; i<)

    }

    _processSockets(){

        setTimeout( this._processSockets.bind(this), 5000 );

        let socket;
        if (this._socketsQueue.length > 0){
            socket = this._socketsQueue[0];
            this._socketsQueue.splice(1,1);
        }

        this.

    }


    _processTransactions(){

        let tx = [];
        for (let i=0; i<this._socketsQueue.length; i++)
            if (this._socketsQueue.length; i++)


        setTimeout( this._processTransactions.bind(this), 5000 );

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