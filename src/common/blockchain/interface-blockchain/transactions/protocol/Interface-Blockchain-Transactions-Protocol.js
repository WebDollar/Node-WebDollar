import NodeProtocol from 'common/sockets/protocol/extend-socket/Node-Protocol';
import NodesList from 'node/lists/nodes-list'

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

        node.on("transactions/get-all-pending-transactions", response => {

            try{

                if (response.format !== "json") response.format = "buffer";

                let list = [];

                console.warn("pendingQueue length", Blockchain.blockchain.transactions.pendingQueue.list.length);
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


        try {
            let answer = await node.sendRequestWaitOnce("transactions/get-all-pending-transactions", {format: "buffer"}, 'answer');
            if (answer !== null && answer !== undefined && answer.result && answer.transactions !== null && Array.isArray(answer.transactions)) {
                let transactions = answer.transactions;

                for (let i = 0; i < transactions.length; i++) {

                    let transaction = Blockchain.blockchain.transactions._createTransactionFromBuffer(transactions[i]).transaction;

                    try {
                        if (!transaction.isTransactionOK())
                            continue;

                        if (!Blockchain.blockchain.transactions.pendingQueue.includePendingTransaction(transaction, socket))
                            ; //console.warn("I already have this transaction", transaction.txId.toString("hex"))

                    } catch (exception){

                    }

                }
            }
        } catch (exception){
            console.error("Error Getting All Pending Transactions", exception);
        }

    }


    propagateNewPendingTransaction(transaction, exceptSockets){

        NodeProtocol.broadcastRequest( "transactions/new-pending-transaction", { format: "buffer", buffer: transaction.serializeTransaction() }, undefined, exceptSockets );

    }

}

export default new InterfaceBlockchainTransactionsProtocol();