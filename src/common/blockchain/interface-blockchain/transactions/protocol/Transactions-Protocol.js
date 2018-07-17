import NodeProtocol from 'common/sockets/protocol/extend-socket/Node-Protocol';
import NodesList from 'node/lists/Nodes-List'
import consts from 'consts/const_global'

import Blockchain from "main-blockchain/Blockchain"
import StatusEvents from "common/events/Status-Events";

import TransactionsListForPropagation from "./Transactions-List-For-Propagation";

class InterfaceBlockchainTransactionsProtocol {

    constructor(blockchain){

        this.blockchain = blockchain;

        //if a new client || or || web peer is established then, I should register for accepting WebPeer connections

        NodesList.emitter.on("nodes-list/connected", (result) => { this._newSocketCreateProtocol(result) } );

        this.transactionsForPropagation = new TransactionsListForPropagation(this.blockchain);

    }

    _newSocketCreateProtocol(nodesListObject){

        let socket = nodesListObject.socket;

        if (Blockchain.MinerPoolManagement.minerPoolStarted){
            return false;
        }

        this.initializeTransactionsPropagation(socket);

        if (Blockchain.loaded){
            this.downloadTransactions(socket, 0, 30);
        }

        //after
        Blockchain.onLoaded.then((answer)=>{
            // in case the Blockchain was not loaded, I will not be interested in transactions

            setTimeout(()=>{

                this.downloadTransactions(socket, 0, 30);

            }, 5000 + Math.random()*5000 );

        });

    }

    async initializeTransactionsPropagation(socket){

        // in case the Blockchain was not loaded, I will not be interested in transactions
        let node = socket.node;

        node.on("transactions/new-pending-transaction", async (response) =>{

            try {

                let transaction;

                if (response.format !== "json") response.format = "buffer";

                if (response.format === 'json') {

                    let json = response.json;
                    transaction = this.blockchain.transactions._createTransaction(json.from, json.to, json.nonce, json.timeLock, json.version);

                } else
                if (response.format === 'buffer')
                    transaction = this.blockchain.transactions._createTransactionFromBuffer(response.buffer).transaction;


                if (transaction === undefined) throw {message: "Transaction was not specified"};

                try {
                    if (!this.blockchain.mining.miningTransactionSelector.validateTransaction(transaction))
                        return false;
                } catch (exception){

                }

                if ( transaction.fee < consts.MINING_POOL.MINING.FEE_THRESHOLD  )  //not good
                    return false;

                if (!transaction.isTransactionOK(undefined, false))
                    return false;

                await this.blockchain.sleep(25);

                if (!this.blockchain.transactions.pendingQueue.includePendingTransaction(transaction, socket))
                    throw {message: "I already have this transaction"};

            } catch (exception){

                if (typeof exception === "object" && exception.message === "I already have this transaction" )
                    return false;

                console.error("Transaction is wrong. It should ban the user", exception);
            }

        });

        node.on("transactions/get-pending-transactions-ids", async (response) => {

            try{

                if (typeof response !== "object") return false;

                if (response.format !== "json")  response.format = "buffer";
                if (typeof response.start  !== "number") response.start = 0;
                if (typeof response.count !== "number") response.count = 0;

                response.count = Math.max(10, response.count);
                response.count = Math.min(40, response.count);

                let list = [];

                this.transactionsForPropagation.refreshTransactionsForPropagationList();

                let length = Math.min( response.start + response.count, this.transactionsForPropagation.list.length );

                await this.blockchain.sleep(20);

                for (let i=response.start; i < length; i++ ){

                    if (response.format === "json") list.push( this.transactionsForPropagation.list[i].txId.toString("hex") ); else
                    if (response.format === "buffer") list.push( this.transactionsForPropagation.list[i].txId );
                }

                node.sendRequest('transactions/get-pending-transactions-ids/answer', { result: true, format: response.format, transactions: list, next: response.start + response.count, length: this.transactionsForPropagation.list.length } );

            } catch (exception){
            }

        });

        node.on("transactions/get-pending-transactions-by-ids", async (response) => {

            try{

                if (typeof response !== "object") return false;

                if (response.format !== "json")  response.format = "buffer";

                if (response.ids === undefined || response.ids === null || !Array.isArray ( response.ids) ) return false;

                let list = [];

                await this.blockchain.sleep(20);

                for (let i=0; i<response.ids.length; i++ ){

                    let transaction = this.blockchain.transactions.pendingQueue.searchPendingTransactionByTxId(response.ids[i]);

                    if (transaction === null || transaction === undefined) continue;

                    if (response.format === "json") list.push( transaction.txId.toString("hex") ); else
                    if (response.format === "buffer") list.push( transaction.serializeTransaction() );

                }

                await this.blockchain.sleep(25);

                node.sendRequest('transactions/get-pending-transactions-by-ids/answer', { result: true, format: response.format, transactions: list } );

            } catch (exception){
            }

        });

        // node.on("transactions/get-all-pending-transactions", async (response) => {
        //
        //     if (Math.random() >= 0.3) return false; // avoid spamming
        //
        //     try{
        //
        //         if (typeof response === "object") return false;
        //
        //         if (response.format !== "json") response.format = "buffer";
        //
        //         let list = [];
        //
        //         for (let i=0; i<Blockchain.blockchain.transactions.pendingQueue.list.length; i++){
        //
        //             if (! Blockchain.blockchain.transactions.pendingQueue.list[i].isTransactionOK(true)) continue;
        //
        //             if (response.format === "json") list.push(Blockchain.blockchain.transactions.pendingQueue.list[i].toJSON()); else
        //             if (response.format === "buffer") list.push(Blockchain.blockchain.transactions.pendingQueue.list[i].serializeTransaction());
        //
        //             if (i % 10 === 0){
        //
        //                 await Blockchain.blockchain.sleep(25);
        //
        //             }
        //
        //         }
        //
        //         node.sendRequest('transactions/get-all-pending-transactions/answer', {result: true, format: response.format, transactions: list });
        //
        //     } catch (exception){
        //     }
        //
        // });


    }


    async downloadTransactions(socket,  start = 0, count = 40){

        try {

            if (socket === undefined) return;
            let answer = await socket.node.sendRequestWaitOnce("transactions/get-pending-transactions-ids", {format: "buffer", start: start, count: count}, 'answer', 5000);

            if (answer === null || answer === undefined || answer.result !== true || answer.transactions === null && !Array.isArray(answer.transactions)) return false;

            let ids = answer.transactions;
            let downloadingTransactions = [];

            await this.blockchain.sleep(30);

            for (let i=0; i<ids.length; i++)

                if (this.blockchain.transactions.pendingQueue.searchPendingTransactionByTxId(ids[i]) === null){

                    downloadingTransactions.push(ids[i]);

                }

            await this.blockchain.sleep(40);

            if ( downloadingTransactions.length === 0) //nothing to download
                return;

            if (socket === undefined) return;

            let answerTransactions = await socket.node.sendRequestWaitOnce("transactions/get-pending-transactions-by-ids", {format: "buffer", ids: downloadingTransactions }, "answer" , 5000);

            if (answerTransactions === null || answerTransactions === undefined || answerTransactions.result !== true || answerTransactions.transactions === null && !Array.isArray(answerTransactions.transactions)) return false;

            let errors = 0;
            for (let i=0; i<answerTransactions.transactions.length; i++){

                let transaction = this.blockchain.transactions._createTransactionFromBuffer(answerTransactions.transactions[i]).transaction;

                try {

                    if ( transaction.fee < consts.MINING_POOL.MINING.FEE_THRESHOLD  ) { //not good
                        errors += 0.25;
                        continue;
                    }

                    try {

                        if (!this.blockchain.mining.miningTransactionSelector.validateTransaction(transaction)){
                            errors += 0.25;
                            continue;
                        }
                    } catch (exception){

                    }

                    if ( !transaction.isTransactionOK(true, false) ) { //not good
                        errors++;
                        continue;
                    }

                    if (!this.blockchain.transactions.pendingQueue.includePendingTransaction(transaction, socket))
                        ; //console.warn("I already have this transaction", transaction.txId.toString("hex"))

                } catch (exception){
                    errors++;
                }

                if (errors >= 4)
                    return;


            }

            await this.blockchain.sleep(50);


            if (start + count < answer.length)
                setTimeout( async ()=>{ await this.downloadTransactions(socket, start+count, count)}, 1500 + (Math.random()*1000) );


        } catch (exception){
            console.error("Error Getting All Pending Transactions", exception);
        }

    }



    propagateNewPendingTransaction(transaction, exceptSockets){

        NodeProtocol.broadcastRequest( "transactions/new-pending-transaction", { format: "buffer", buffer: transaction.serializeTransaction() }, undefined, exceptSockets );

    }

}

export default InterfaceBlockchainTransactionsProtocol;