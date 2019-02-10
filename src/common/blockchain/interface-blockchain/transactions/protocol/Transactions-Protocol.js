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

        NodesList.emitter.on("nodes-list/connected", (result) => { this._newSocketCreateProtocol(result) } );

        StatusEvents.on('blockchain/status', async (data)=>{

            if (this.blockchain.MinerPoolManagement !== undefined && this.blockchain.MinerPoolManagement.minerPoolStarted)
                return false;

            if (data.message === "Blockchain Ready to Mine" && NodesList !== undefined)
                for (let i=0; i < NodesList.nodes.length; i++)
                    if (NodesList.nodes[i] !== undefined && NodesList.nodes[i].socket !== undefined && NodesList.nodes[i].socket.node.protocol.connectionType === CONNECTION_TYPE.CONNECTION_CLIENT_SOCKET)
                        this.transactionsDownloadingManager.addSocket(NodesList.nodes[i].socket);


        } );

    }

    _newSocketCreateProtocol(nodesListObject){

        let socket = nodesListObject.socket;

        if (this.blockchain.MinerPoolManagement !== undefined && this.blockchain.MinerPoolManagement.minerPoolStarted)
            return false;

        this.initializeTransactionsPropagation(socket);

        if (this.blockchain.loaded)
            this.transactionsDownloadingManager.addSocket(socket);

    }

    async initializeTransactionsPropagation(socket){

        socket.node.on("transactions/missing-nonce", async (response) =>{

            try {

                let transaction;

                if ( !Buffer.isBuffer(response.buffer)) throw {message: "missing-nonce - address buffer is invalid", response};
                if ( !typeof "number" ) throw {message: "missing-nonce - nonce is not a number", response};

                if (response.nonce > this.blockchain.accountantTree.getAccountNonce(response.buffer)){

                    if( typeof response === "object"){

                        transaction = this.blockchain.transactions.pendingQueue.findPendingTransactionByAddressAndNonce(response.buffer,response.nonce);

                        if(transaction){
                            console.warn("Sending missing nonce", transaction);
                            socket.node.sendRequest('transactions/missing-nonce/answer', { result: transaction ? true : false, transaction: transaction } );
                        }

                    }

                }

            } catch (exception){

                console.error("missing-nonce - Failed", exception);

            }

        });

        socket.node.on("transactions/missing-nonce/answer", async (response) =>{

            try {

                if (!response.result) throw {message:"missing-nonce - Response is false"};

                this.transactionsDownloadingManager.addTransaction(socket, response.transaction, true );

            } catch (exception){

                console.error("missing-nonce - Failed", exception);

            }

        });

        // in case the Blockchain was not loaded, I will not be interested in transactions

        socket.node.on("transactions/new-pending-transaction", async (response) =>{

            try {

                if ( !Buffer.isBuffer(response.buffer)) throw {message: "Transaction Id is invalid"};

                this.transactionsDownloadingManager._createTransaction(response.buffer,socket);

            } catch (exception){

                if (consts.DEBUG)
                    console.error("Transaction is wrong. It should ban the user", exception);

            }

        });

        socket.node.on("transactions/new-pending-transaction-id", async (data)=>{

            try{

                if ( !Buffer.isBuffer(data.txId)) throw {message: "Transaction buffer is invalid"};

                this.transactionsDownloadingManager.addTransaction(socket, data.txId );

            } catch(exception){
                if (consts.DEBUG)
                    console.error("Transaction is wrong. It should ban the user", exception);
            }

        } );

        socket.node.on("transactions/get-pending-transactions-ids", async (response) => {

            try{

                if (typeof response !== "object") return false;

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

            } catch (exception){

                console.error("Failed to send tx list for download");

            }

        });

        socket.node.on("transactions/get-pending-transactions-by-ids", async (response) => {

            let transaction = undefined;

            try{

                if (typeof response !== "object") return false;

                if (response.format !== "json")  response.format = "buffer";

                if (response.ids === undefined || response.ids === null || !Array.isArray ( response.ids) ) return false;

                let list = [];

                await this.blockchain.sleep(20);

                for (let i=0; i<response.ids.length; i++ ){

                    if(response.ids[i].length !== consts.BLOCKCHAIN.BLOCKS_POW_LENGTH)
                        continue;

                    transaction = this.blockchain.transactions.pendingQueue.findPendingTransaction(response.ids[i]);

                    if ( !transaction ) {
                        await this.blockchain.sleep(20);
                        continue;
                    }

                    await this.blockchain.sleep(20);

                    if (response.format === "json") list.push( transaction.txId.toString("hex") ); else
                    if (response.format === "buffer") list.push( transaction.serializeTransaction() );

                    transaction = undefined;

                }

                await this.blockchain.sleep(200);

                socket.node.sendRequest('transactions/get-pending-transactions-by-ids/answer', { result: true, format: response.format, transactions: list } );

            } catch (exception){

                console.error("error sending tx -",transaction, exception)

            }

        });


    }

    async downloadTransactions(socket, start, count, max){

        if (start >= max) return false;

        if (typeof socket === "undefined") return false;

        try{

            let answer = await socket.node.sendRequestWaitOnce("transactions/get-pending-transactions-ids", {format: "buffer", start: start, count: count}, 'answer', 12*1000);

            if (answer === null || answer === undefined || answer.result !== true || answer.transactions === null && !Array.isArray(answer.transactions)) return false;

            for (let i=0; i<answer.transactions.length; i++)
                this.transactionsDownloadingManager.addTransaction( socket, answer.transactions[ i ] );

            if (start + count < answer.length)
                return await this.downloadTransactions(socket, start+count, count, max);

        } catch (exception){

            if (consts.DEBUG)
                console.error("Error Getting All Pending Transactions", exception);

            return false;

        }

    }

    async downloadTransaction(socket, txId){

        if (typeof socket === "undefined") return false;

        try {

            let answerTransactions = await socket.node.sendRequestWaitOnce("transactions/get-pending-transactions-by-ids", {
                format: "buffer",
                ids: [txId],
            }, "answer", 3000);

            if (answerTransactions === null || answerTransactions === undefined || answerTransactions.result !== true || answerTransactions.transactions === null && !Array.isArray(answerTransactions.transactions)) {
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

        if (!Array.isArray(exceptSockets) )
            exceptSockets = [exceptSockets];

        if (Blockchain.PoolManagement.poolStarted)
            Blockchain.PoolManagement.poolProtocol.poolConnectedMinersProtocol.list.forEach( (element)=>{
                exceptSockets.push(element);
            });


        NodeProtocol.broadcastRequest( "transactions/new-pending-transaction-id", { txId: transaction.txId }, undefined, exceptSockets );

    }

    propagateNewMissingNonce(addressBuffer,nonce){
        NodeProtocol.broadcastRequest( "transactions/missing-nonce", { buffer: addressBuffer, nonce: nonce }, undefined, undefined );
        console.warn("I miss nonce", nonce, "for", addressBuffer);
    }

}

export default InterfaceBlockchainTransactionsProtocol;
