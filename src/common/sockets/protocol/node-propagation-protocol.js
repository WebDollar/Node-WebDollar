import consts from 'consts/const_global'

import NodesWaitlist from 'node/lists/waitlist/nodes-waitlist'
import NodeProtocol from 'common/sockets/protocol/node-protocol';

class NodePropagationProtocol {

    constructor(){
        console.log("NodePropagation constructor");
    }


    initializeSocketForPropagation(node){

        node.on("propagation/nodes", response => {

            /*
                sample data
                {
                    "instruction": "new-address",
                    "addresses": []
                }
             */

            console.log("NodePropagation",  node.sckAddress.getAddress());

            let instruction = response.instruction||'';
            switch (instruction){
                case "new-nodes":

                    let addresses =  response.addresses || [];
                    if (Array.isArray(addresses)){

                        for (let i=0; i<addresses.length; i++){

                            let address = addresses[i].addr;
                            let port = addresses[i].port;
                            let type = addresses[i].type;

                            NodesWaitlist.addNewNodeToWaitlist(address, port, type);
                        }
                    }

                    break;
            }

        });

    }

    propagateNewNodes(nodes){

        if (typeof nodes === 'string') nodes = [nodes];

        NodeProtocol.broadcastRequest("propagation/nodes", {instruction: "new-nodes", nodes: nodes });

    }

    propagateNewPendingTransaction(transaction){

        NodeProtocol.broadcastRequest("propagation/transactions/pending", {instruction: "new-transaction",  transaction: transaction.toJSON() } );

    }



}

export default new NodePropagationProtocol();
