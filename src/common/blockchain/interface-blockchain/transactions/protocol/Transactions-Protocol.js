import NodeProtocol from 'common/sockets/protocol/extend-socket/Node-Protocol';
import NodesList from 'node/lists/Nodes-List'
import consts from 'consts/const_global'

import Blockchain from "main-blockchain/Blockchain"
import StatusEvents from "common/events/Status-Events";

import TransactionsListForPropagation from "./Transactions-List-For-Propagation";
import CONNECTION_TYPE from "node/lists/types/Connection-Type";

import TransactionsDownloadManager from "./Transactions-Download-Manager";
import WebDollarCrypto from 'common/crypto/WebDollar-Crypto'

class InterfaceBlockchainTransactionsProtocol {

    constructor(blockchain){

        this.blockchain = blockchain;

        this.transactionsDownloadingManager = new TransactionsDownloadManager(blockchain, this);

        //if a new client || or || web peer is established then, I should register for accepting WebPeer connections

        NodesList.emitter.on("nodes-list/connected", (result) => { this._newSocketCreateProtocol(result) } );

        this.transactionsForPropagation = new TransactionsListForPropagation(this.blockchain);

        StatusEvents.on('blockchain/status', async (data)=>{

            if (Blockchain.MinerPoolManagement !== undefined && Blockchain.MinerPoolManagement.minerPoolStarted)
                return false;

            if (data.message === "Blockchain Ready to Mine" && NodesList !== undefined)
                for (let i=0; i < NodesList.nodes.length; i++)
                    if (NodesList.nodes[i] !== undefined && NodesList.nodes[i].socket !== undefined && NodesList.nodes[i].socket.node.protocol.connectionType === CONNECTION_TYPE.CONNECTION_CLIENT_SOCKET)
                        this.transactionsDownloadingManager.addSocket(NodesList.nodes[i].socket);


        } );

    }

    _newSocketCreateProtocol(nodesListObject){

        let socket = nodesListObject.socket;

        if (Blockchain.MinerPoolManagement !== undefined && Blockchain.MinerPoolManagement.minerPoolStarted)
            return false;

        this.initializeTransactionsPropagation(socket);

        if (Blockchain.loaded)
            this.transactionsDownloadingManager.addSocket(socket);

    }

    async initializeTransactionsPropagation(socket){

        // in case the Blockchain was not loaded, I will not be interested in transactions

        socket.node.on("transactions/new-pending-transaction", async (response) =>{

            try {

                let txId, buffer;

                if (response.format === 'json' || response.format === undefined) {

                    let json = response.json;
                    txId = json.txId;

                } else
                if (response.format === 'buffer'){
                    txId = WebDollarCrypto.SHA256( WebDollarCrypto.SHA256( response.buffer ));
                    buffer = response.buffer;
                }

                this.transactionsDownloadingManager.addTransaction(socket, txId, buffer );

            } catch (exception){

                if (consts.DEBUG)
                    console.error("Transaction is wrong. It should ban the user", exception);

            }

        });

        socket.node.on("transactions/new-pending-transaction-id", (data)=>{

            try{

                if ( !Buffer.isBuffer(data.txId)) throw {message: "Transaction Id is invalid"};

                this.transactionsDownloadingManager.addTransaction(socket, data.txId, undefined );

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

                //Todo Delete transactionsForPropagation class (in order to remove a useless loop ), if validation of transaction at refresh list won't change the transactions from the list comaring to PendingQueue list
                this.transactionsForPropagation.refreshTransactionsForPropagationList();

                let length = Math.min( response.start + response.count, this.transactionsForPropagation.list.length );

                await this.blockchain.sleep(20);

                for (let i=response.start; i < length; i++ ){

                    if (response.format === "json") list.push( this.transactionsForPropagation.list[i].txId.toString("hex") ); else
                    if (response.format === "buffer") list.push( this.transactionsForPropagation.list[i].txId );

                    if (i % 20 === 0)
                        await this.blockchain.sleep( 20 );

                }

                socket.node.sendRequest('transactions/get-pending-transactions-ids/answer', { result: true, format: response.format, transactions: list, next: response.start + response.count, length: this.transactionsForPropagation.list.length } );

            } catch (exception){
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

                    transaction = this.blockchain.transactions.pendingQueue.findPendingTransaction(response.ids[i]);

                    if (transaction === null || transaction === undefined) {
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

                console.error("error sending tx",exception,transaction)

            }

        });


    }

    async downloadTransactions(socket, start, count, max){

        if (start >= max) return;

        if (socket === undefined) return;

        try{

            let answer = await socket.node.sendRequestWaitOnce("transactions/get-pending-transactions-ids", {format: "buffer", start: start, count: count}, 'answer', 5000);
            if (answer === null || answer === undefined || answer.result !== true || answer.transactions === null && !Array.isArray(answer.transactions)) return false;

            let ids = answer.transactions;

            for (let i=0; i<ids.length; i++)
                this.transactionsDownloadingManager.addTransaction( socket, ids[ i ] );

            if (start + count < answer.length)
                await this.downloadTransactions(socket, start+count, count, max);

        } catch (exception){

            if (consts.DEBUG)
                console.error("Error Getting All Pending Transactions", exception);

        }

    }

    async downloadTransaction(socket, txId){

        try {

            let answerTransactions = await socket.node.sendRequestWaitOnce("transactions/get-pending-transactions-by-ids", {
                format: "buffer",
                ids: [txId],
            }, "answer", 6000);

            if (answerTransactions === null || answerTransactions === undefined || answerTransactions.result !== true || answerTransactions.transactions === null && !Array.isArray(answerTransactions.transactions)) return false;

            return answerTransactions.transactions[0];


        } catch (exception){

        }

        return null;

    }


    propagateNewPendingTransaction(transaction, exceptSockets){

        // NodeProtocol.broadcastRequest( "transactions/new-pending-transaction", { format: "buffer", buffer: transaction.serializeTransaction() }, undefined, exceptSockets );
        NodeProtocol.broadcastRequest( "transactions/new-pending-transaction-id", { txId: transaction.txId }, undefined, exceptSockets );

    }

}

export default InterfaceBlockchainTransactionsProtocol;