/* eslint-disable */
import NodeProtocol from 'common/sockets/protocol/extend-socket/Node-Protocol';
import NodesList from 'node/lists/Nodes-List'
import consts from 'consts/const_global'

import Blockchain from "main-blockchain/Blockchain"
import StatusEvents from "common/events/Status-Events";

import CONNECTION_TYPE from "node/lists/types/Connection-Type";

import TransactionsDownloadManager from "./Transactions-Download-Manager";
import WebDollarCrypto from 'common/crypto/WebDollar-Crypto'

class InterfaceBlockchainTransactionsProtocol {

    constructor(blockchain){

        this.blockchain = blockchain;

        this.transactionsDownloadingManager = new TransactionsDownloadManager(blockchain, this);

        //if a new client || or || web peer is established then, I should register for accepting WebPeer connections

        NodesList.emitter.on("nodes-list/connected", (result) => this._newSocketCreateProtocol(result) );

        StatusEvents.on('blockchain/status', async (data)=>{

            if (data.message === "Blockchain Ready to Mine" )
                for (let i=0; i < NodesList.nodes.length; i++)
                    if ( NodesList.nodes[i] && NodesList.nodes[i].socket  && !NodesList.nodes[i].socket.node.protocol.transactionsInitializedProtocol)
                        this._initializeSocket(NodesList.nodes[i].socket)

        });

    }

    _newSocketCreateProtocol(nodesListObject) {

        if (Blockchain.loaded)
            this._initializeSocket(nodesListObject.socket)

    }

    _initializeSocket(socket){

        if (socket.node.protocol.transactionsInitializedProtocol) return;

        socket.node.protocol.transactionsInitializedProtocol = true;

        this.transactionsDownloadingManager.addSocket(socket);

        this.initializeTransactionsPropagation(socket);

    }

    initializeTransactionsPropagation(socket){

        socket.node.on("transactions/missing-nonce", async (response) =>{

            if ( Blockchain.MinerPoolManagement.minerPoolStarted ) return;

            let transaction;

            if (!response || typeof response !== "object") throw {message: "missing-nonce invalid response"}
            if ( !Buffer.isBuffer(response.buffer)) throw {message: "missing-nonce - address buffer is invalid", response};
            if ( typeof response.nonce !== "number" ) throw {message: "missing-nonce - nonce is not a number", response};

            if (response.nonce > this.blockchain.accountantTree.getAccountNonce(response.buffer)){

                transaction = this.blockchain.transactions.pendingQueue.findPendingTransactionByAddressAndNonce(response.buffer,response.nonce);

                if(transaction){
                    console.warn("Sending missing nonce", transaction);
                    socket.node.sendRequest('transactions/missing-nonce/answer', { result: transaction ? true : false, transaction: transaction } );
                }

            }


        });

        socket.node.on("transactions/missing-nonce/answer", async (response) =>{

            if ( Blockchain.MinerPoolManagement.minerPoolStarted ) return;

            if (!response.result) throw {message:"missing-nonce - Response is false"};

            await this.transactionsDownloadingManager.addTransaction(socket, response.transaction, true );


        });

        // in case the Blockchain was not loaded, I will not be interested in transactions

        socket.node.on("transactions/new-pending-transaction", async (response) =>{

            try {

                if ( !Buffer.isBuffer(response.buffer)) throw {message: "Transaction Id is invalid"};

                await this.transactionsDownloadingManager._createTransaction(response.buffer,socket);

            } catch (exception){

                if (consts.DEBUG)
                    console.error("Transaction is wrong. It should ban the user", exception);

            }

        });

        socket.node.on("transactions/new-pending-transaction-id", async (data)=>{

            if ( !Buffer.isBuffer(data.txId)) throw {message: "Transaction buffer is invalid"};

            await this.transactionsDownloadingManager.addTransaction(socket, data.txId );

        } );

        socket.node.on("transactions/get-pending-transactions-ids", async (response) => {

            if (! response ) return false;
            if (response.format !== "json")  response.format = "buffer";
            if (typeof response.start  !== "number") response.start = 0;
            if (typeof response.count !== "number") response.count = 0;

            response.count = Math.max(10, response.count);
            response.count = Math.min(40, response.count);

            let list = [];

            let length = Math.min( response.start + response.count, this.blockchain.transactions.pendingQueue.listArray.length );

            await this.blockchain.sleep(20);

            for (let i=response.start; i < length; i++ ){

                if (response.format === "json") list.push( this.blockchain.transactions.pendingQueue.listArray[i].txId.toString("hex") ); else
                if (response.format === "buffer") list.push( this.blockchain.transactions.pendingQueue.listArray[i].txId );

                if (i % 20 === 0)
                    await this.blockchain.sleep( 20 );

            }

            socket.node.sendRequest('transactions/get-pending-transactions-ids/answer', { result: true, format: response.format, transactions: list, next: response.start + response.count, length: this.blockchain.transactions.pendingQueue.listArray.length } );

        });

        socket.node.on("transactions/get-pending-transactions-by-ids", async (response) => {

            if (!response ) return false;

            if (response.format !== "json")  response.format = "buffer";

            if (!response.ids || !Array.isArray ( response.ids) ) return false;

            let list = [];

            await this.blockchain.sleep(20);

            for (let i=0; i<response.ids.length; i++ ){

                if(response.ids[i].length !== consts.BLOCKCHAIN.BLOCKS_POW_LENGTH)
                    continue;

                let transaction = this.blockchain.transactions.pendingQueue.findPendingTransaction(response.ids[i]);

                if ( !transaction ) {
                    await this.blockchain.sleep(20);
                    continue;
                }

                await this.blockchain.sleep(20);

                if (response.format === "json") list.push( transaction.txId.toString("hex") ); else
                if (response.format === "buffer") list.push( transaction.serializeTransaction() );

            }

            await this.blockchain.sleep(200);

            socket.node.sendRequest('transactions/get-pending-transactions-by-ids/answer', { result: true, format: response.format, transactions: list } );

        });


    }

    async downloadTransactions(socket, start, count, max){

        if (start >= max) return false;

        if (! socket ) return false;

        try{

            let answer = await socket.node.sendRequestWaitOnce("transactions/get-pending-transactions-ids", {format: "buffer", start: start, count: count}, 'answer', 12*1000);

            if (!answer || answer.result !== true || !answer.transactions || !Array.isArray(answer.transactions)) return false;

            for (let i=0; i<answer.transactions.length; i++)
                await this.transactionsDownloadingManager.addTransaction( socket, answer.transactions[ i ] );

            if (start + count < answer.length)
                return await this.downloadTransactions(socket, start+count, count, max);

        } catch (exception){

            if (consts.DEBUG)
                console.error("Error Getting All Pending Transactions", exception);

            return false;

        }

    }

    async downloadTransaction(socket, txId){

        if (!socket ) return false;

        try {

            let answerTransactions = await socket.node.sendRequestWaitOnce("transactions/get-pending-transactions-by-ids", {
                format: "buffer",
                ids: [txId],
            }, "answer", 3000);

            if (!answerTransactions || !answerTransactions.result || !answerTransactions.transactions || !Array.isArray(answerTransactions.transactions)) {
                console.warn("Transaction", txId.toString('hex') ,"was not sent");
                return false;
            }

            return answerTransactions.transactions[0];


        } catch (exception){

            console.error("Error sending tx", exception)

        }

        return null;

    }

    propagateNewPendingTransaction(transaction, exceptSockets = []){

        if (!Array.isArray(exceptSockets) ) exceptSockets = [exceptSockets];

        if (Blockchain.PoolManagement.poolStarted)
            for (let element of Blockchain.PoolManagement.poolProtocol.poolConnectedMinersProtocol.list)
                exceptSockets.push(element);

        NodeProtocol.broadcastRequest( "transactions/new-pending-transaction-id", { txId: transaction.txId }, undefined, exceptSockets );

    }

    propagateNewMissingNonce(addressBuffer,nonce, exceptSockets){

        if (exceptSockets === "all") return;

        if (!Array.isArray(exceptSockets) ) exceptSockets = [exceptSockets];

        if (Blockchain.PoolManagement.poolStarted)
            for (let element of Blockchain.PoolManagement.poolProtocol.poolConnectedMinersProtocol.list)
                exceptSockets.push( element );

        NodeProtocol.broadcastRequest( "transactions/missing-nonce", { buffer: addressBuffer, nonce: nonce }, undefined, exceptSockets );
        console.warn("I miss nonce", nonce, "for", addressBuffer);
    }

}

export default InterfaceBlockchainTransactionsProtocol;
