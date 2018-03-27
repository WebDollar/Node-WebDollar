import NodeProtocol from 'common/sockets/protocol/node-protocol';
import NodesList from 'node/lists/nodes-list'

import Blockchain from "main-blockchain/Blockchain"

class InterfaceBlockchainTransactionsProtocol{

    constructor(){
        //if a new client || or || web peer is established then, I should register for accepting WebPeer connections
        NodesList.emitter.on("nodes-list/connected", (result) => { this._newSocketCreateProtocol(result) } );
    }

    _newSocketCreateProtocol(nodesListObject){

        let socket = nodesListObject.socket;

        //after
        Blockchain.onLoaded.then((loaded)=>{

            // in case the Blockchain was not loaded, I will not be interested in transactions
            this.initializeTransactionsPropagation(socket.node);

        })

    }

    initializeTransactionsPropagation(node){

        // in case the Blockchain was not loaded, I will not be interested in transactions

        node.on("transactions/new-pending-transaction", response =>{

            try {

                let transaction;

                if (response.format !== "json") response.format = "buffer";

                if (response.format === 'json') {

                    let json = response.json;
                    transaction = Blockchain.blockchain.transactions._createTransaction(json.from, json.to, json.nonce, json.timeLock, json.version);

                } else
                if (response.format === 'buffer')
                    transaction = Blockchain.blockchain.transactions.createTransactionFromBuffer(response.buffer);


                if (transaction === undefined) throw {message: "Transaction was not specified"};

                transaction.validateTransactionOnce();

                if (!Blockchain.blockchain.transactions.pendingQueue.includePendingTransaction(transaction))
                    throw {message: "I already have this transaction"};

            } catch (exception){
                console.error("Transaction is wrong. It should ban the user", exception);
            }

        });

        node.on("transactions/get-all-pending-transactions", response => {

            try{

                if (response.format !== "json") response.format = "buffer";

                let list = [];

                Blockchain.blockchain.transactions.pendingQueue.list.forEach((pendingTransaction)=>{

                    if (response.format === "json")
                        list.push(pendingTransaction.toJSON());
                    else
                    if (response.format === "buffer")
                        list.push(pendingTransaction.serializeTransaction());

                });

                node.sendRequest('transactions/get-all-pending-transactions/answer', {result: true, format: response.format, transactions: list });

            } catch (exception){
            }

        });


        let answer = node.sendRequestWaitOnce("propagation/transactions/get-all-pending-transactions", {format: "buffer"},'/answer' );
        if ( answer.result && answer.transactions !== null && Array.isArray(answer.transactions) ){
            let transactions = answer.transactions;

            for (let i=0; transactions.length ;i++){

                let transaction = Blockchain.blockchain.transactions.createTransactionFromBuffer(transactions[i]);

                transaction.validateTransactionOnce(undefined, false);

                try {

                    transaction.validateTransactionEveryTime();

                } catch (exception){

                    console.warn ("Transaction had not enough money, so I am skipping it", exception);
                    continue;
                }

                if (!Blockchain.blockchain.transactions.pendingQueue.includePendingTransaction(transaction))
                    console.warn ("I already have this transaction", transaction.txId)

            }
        }

    }


    propagateNewPendingTransaction(transaction, exceptSockets){

        NodeProtocol.broadcastRequest("transactions/new-pending-transaction", {  transaction: transaction.toJSON() }, undefined, exceptSockets );

    }

}

export default new InterfaceBlockchainTransactionsProtocol();