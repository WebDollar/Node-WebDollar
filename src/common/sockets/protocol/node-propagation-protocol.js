import consts from 'consts/const_global'

import NodesWaitlist from 'node/lists/waitlist/nodes-waitlist'
import NodeProtocol from 'common/sockets/protocol/node-protocol';
import InterfaceBlockchainTransaction from 'common/blockchain/interface-blockchain/transactions/transaction/Interface-Blockchain-Transaction'

import Blockchain from "main-blockchain/Blockchain"

class NodePropagationProtocol {

    constructor(){
        console.log("NodePropagation constructor");
    }


    initializeSocketForPropagation(node){

        this.initializeNodesPropagation(node);
        this.initializeTransactionsPropagation(node);

    }

    initializeNodesPropagation(node){

        node.on("propagation/nodes", response => {

            try {
                console.log("NodePropagation", node.sckAddress.getAddress());

                let instruction = response.instruction || '';
                switch (instruction) {
                    case "new-nodes":

                        let addresses = response.addresses || [];
                        if (Array.isArray(addresses)) {

                            for (let i = 0; i < addresses.length; i++) {

                                let address = addresses[i].addr;
                                let port = addresses[i].port;
                                let type = addresses[i].type;

                                NodesWaitlist.addNewNodeToWaitlist(address, port, type, node.level + 1);
                            }
                        }

                        break;
                }

            }
            catch (exception){

            }

        });
    }

    initializeTransactionsPropagation(node){

        node.on("propagation/transactions", response => {

            try {
                console.log("Propagation New Transaction", node.sckAddress.getAddress());

                let instruction = response.instruction || '';
                switch (instruction) {
                    case "new-pending-transaction":

                        let from = response.transaction.from;
                        let to = response.transaction.to;
                        let nonce = response.transaction.nonce;

                        try {

                            let transaction = new InterfaceBlockchainTransaction(Blockchain.blockchain, from, to, nonce);

                            alert('it must verify if it already exists');
                            if (!Blockchain.blockchain.transactions.pendingQueue.includePendingTransaction(transaction))
                                throw "i already have this transaction";

                        } catch (exception) {
                            console.error("Transaction is wrong. It should ban the user");
                        }

                        break;
                }

            } catch (exception){

            }

        });

    }

    propagateNewNodes(nodes, exceptSockets){

        if (typeof nodes === 'string') nodes = [nodes];

        NodeProtocol.broadcastRequest("propagation/nodes", {instruction: "new-nodes", nodes: nodes }, undefined, exceptSockets);

    }

    propagateNewPendingTransaction(transaction, exceptSockets){

        NodeProtocol.broadcastRequest("propagation/transactions", { instruction: "new-pending-transaction",  transaction: transaction.toJSON() }, undefined, exceptSockets );

    }

}

export default new NodePropagationProtocol();
