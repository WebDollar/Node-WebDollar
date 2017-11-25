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
                case "new-address":

                    let addresses =  response.addresses || [];
                    if (Array.isArray(addresses)){

                        for (let i=0; i<addresses.length; i++){
                            let address = addresses[i];
                            NodesWaitlist.addNewNodeToWaitlist(address);
                        }
                    }

                    break;
            }

        });

    }

    propagateNewNodeAddresses(addresses){

        if (typeof addresses === 'string') addresses = [addresses];

        NodeProtocol.broadcastRequest("propagation/nodes", {instruction: "new-address", addresses: addresses });

    }

    propagateNewPendingTransaction(transaction){

        NodeProtocol.broadcastRequest("propagation/transactions/pending", {instruction: "new-transaction",  transaction: transaction.toJSON() } );

    }



}

export default new NodePropagationProtocol();
