import NodeProtocol from 'common/sockets/protocol/extend-socket/Node-Protocol';
import NodesList from 'node/lists/Nodes-List'

import Blockchain from "main-blockchain/Blockchain"
import StatusEvents from "common/events/Status-Events";

class InterfaceBlockchainTransactionsProtocol{

    constructor(){
        //if a new client || or || web peer is established then, I should register for accepting WebPeer connections

        NodesList.emitter.on("nodes-list/connected", (result) => { this._newSocketCreateProtocol(result) } );

    }

    _newSocketCreateProtocol(nodesListObject){

        let socket = nodesListObject.socket;

        if (Blockchain.loaded){
            this.initializeTransactionsPropagation(socket);
            return;
        }

        //after
        Blockchain.onLoaded.then((answer)=>{
            // in case the Blockchain was not loaded, I will not be interested in transactions

            setTimeout(()=>{

                this.initializeTransactionsPropagation(socket);

            }, 8000)

        });

    }

    async initializeTransactionsPropagation(socket){

        // in case the Blockchain was not loaded, I will not be interested in transactions
        let node = socket.node;

        node.on("transactions/new-pending-transaction", response =>{

            try {

                let transaction;

                if (response.format !== "json") response.format = "buffer";

                if (response.format === 'json') {

                    let json = response.json;
                    transaction = Blockchain.blockchain.transactions._createTransaction(json.from, json.to, json.nonce, json.timeLock, json.version);

                } else
                if (response.format === 'buffer')
                    transaction = Blockchain.blockchain.transactions._createTransactionFromBuffer(response.buffer).transaction;


                if (transaction === undefined) throw {message: "Transaction was not specified"};

                if (!transaction.isTransactionOK())
                    return false;


                if (!Blockchain.blockchain.transactions.pendingQueue.includePendingTransaction(transaction, socket))
                    throw {message: "I already have this transaction"};

            } catch (exception){

                if (typeof exception === "object" && exception.message === "I already have this transaction" )
                    return false;

                console.error("Transaction is wrong. It should ban the user", exception);
            }

        });

        node.on("transactions/get-pending-transactions-ids", response => {

            try{

                if (typeof response === "object") return false;

                if (response.format !== "json")  response.format = "buffer";
                if (typeof response.start  !== "number") response.start = 0;
                if (typeof response.count !== "number") response.count = 0;

                response.count = Math.max(10, response.count);
                response.count = Math.min(40, response.count);

                let list = [];

                let length = Math.min( response.start + response.count, Blockchain.blockchain.transactions.pendingQueue.list.length );

                for (let i=response.start; i < length; i++ ){

                    if (response.format === "json") list.push( Blockchain.blockchain.transactions.pendingQueue.list[i].txId.toString("hex") ); else
                    if (response.format === "buffer") list.push( Blockchain.blockchain.transactions.pendingQueue.list[i].txId );
                }

                node.sendRequest('transactions/get-pending-transactions-ids/answer', { result: true, format: response.format, transactions: list, next: response.index + response.count, length: Blockchain.blockchain.transactions.pendingQueue.list.length } );

            } catch (exception){
            }

        });

        node.on("transactions/get-pending-transactions-by-ids", response => {

            try{

                if (typeof response === "object") return false;

                if (response.format !== "json")  response.format = "buffer";

                if (response.ids === undefined || response.ids === null || !Array.isArray ( response.ids) ) return false;

                let list = [];

                for (let i=0; i<response.ids.length; i++ ){

                    let transaction = Blockchain.blockchain.transactions.pendingQueue.searchPendingTransactionByTxId(response.ids[i]);

                    if (transaction === null) continue;
                    if (!transaction.isTransactionOK(true)) continue;

                    if (response.format === "json") list.push( transaction.txId.toString("hex") ); else
                    if (response.format === "buffer") list.push( transaction.serializeTransaction() );
                }

                node.sendRequest('transactions/get-pending-transactions-ids/answer', { result: true, format: response.format, transactions: list } );

            } catch (exception){
            }

        });

        node.on("transactions/get-all-pending-transactions", response => {

            if (Math.random() >= 0.3) return false; // avoid spamming

            try{

                if (typeof response === "object") return false;

                if (response.format !== "json") response.format = "buffer";

                let list = [];

                for (let i=0; i<Blockchain.blockchain.transactions.pendingQueue.list.length; i++){

                    if (! Blockchain.blockchain.transactions.pendingQueue.list[i].isTransactionOK(true)) continue;

                    if (response.format === "json") list.push(Blockchain.blockchain.transactions.pendingQueue.list[i].toJSON()); else
                    if (response.format === "buffer") list.push(Blockchain.blockchain.transactions.pendingQueue.list[i].serializeTransaction());

                }

                node.sendRequest('transactions/get-all-pending-transactions/answer', {result: true, format: response.format, transactions: list });

            } catch (exception){
            }

        });


        this.downloadTransactions(socket, 0, 30);

    }


    async downloadTransactions(socket,  start = 0, count = 40){

        try {

            let answer = await socket.node.sendRequestWaitOnce("transactions/get-pending-transactions-by-ids", {format: "buffer", start: start, count: count}, 'answer', 5000);

            if (answer === null || answer === undefined || answer.result !== true || answer.transactions === null && !Array.isArray(answer.transactions)) return false;

            let ids = answer.transactions;
            let downloadingTransactions = [];

            for (let i=0; i<ids.length; i++)

                if (Blockchain.blockchain.transactions.pendingQueue.searchPendingTransactionByTxId(ids[i]) === null){

                    downloadingTransactions.push(ids[i]);

                }

            let answerTransactions = await socket.node.sendRequestWaitOnce("transactions/get-pending-transactions-by-ids", {format: "buffer", ids: downloadingTransactions }, "answer" , 5000);

            if (answerTransactions === null || answerTransactions === undefined || answerTransactions.result !== true || answerTransactions.transactions === null && !Array.isArray(answerTransactions.transactions)) return false;

            for (let i=0; i<answerTransactions.transactions.length; i++){

                let transaction = Blockchain.blockchain.transactions._createTransactionFromBuffer(answerTransactions.transactions[i]).transaction;

                try {

                    if ( !transaction.isTransactionOK() )
                        continue;

                    if (!Blockchain.blockchain.transactions.pendingQueue.includePendingTransaction(transaction, socket))
                        ; //console.warn("I already have this transaction", transaction.txId.toString("hex"))

                } catch (exception){

                }

            }


            if (start + count < answer.length)
                setTimeout( async ()=>{ await this.downloadTransactions(this, start+count, count)}, 1500 );


        } catch (exception){
            console.error("Error Getting All Pending Transactions", exception);
        }

    }


    propagateNewPendingTransaction(transaction, exceptSockets){

        NodeProtocol.broadcastRequest( "transactions/new-pending-transaction", { format: "buffer", buffer: transaction.serializeTransaction() }, undefined, exceptSockets );

    }

}

export default new InterfaceBlockchainTransactionsProtocol();