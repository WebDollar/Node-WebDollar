import {nodeProtocol, nodeFallBackInterval} from 'consts/const_global'

import NodesWaitlist from 'node/lists/waitlist/nodes-waitlist'
import NodeProtocol from 'common/sockets/protocol/node-protocol';

class NodePropagationProtocol {

    constructor(){
        console.log("NodePropagation constructor");
    }


    initializeSocketForPropagation(node){

        node.on("node_propagation", response => {

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

    propagateNewAddresses(addresses){

        if (typeof addresses === 'string') addresses = [addresses];

        NodeProtocol.broadcastMessageAllSockets("node_propagation", {instruction: "new-address", addresses: addresses });

    }



}

export default new NodePropagationProtocol();
