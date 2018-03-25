import consts from 'consts/const_global'

import NodesWaitlist from 'node/lists/waitlist/nodes-waitlist'
import NodeProtocol from 'common/sockets/protocol/node-protocol';

import Blockchain from "main-blockchain/Blockchain"

class NodePropagationProtocol {

    constructor(){
        console.log("NodePropagation constructor");
    }


    initializeSocketForPropagation(node){

        this.initializeNodesPropagation(node);

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



    propagateNewNodes(nodes, exceptSockets){

        if (typeof nodes === 'string') nodes = [nodes];

        NodeProtocol.broadcastRequest("propagation/nodes", {instruction: "new-nodes", nodes: nodes }, undefined, exceptSockets);

    }


}

export default new NodePropagationProtocol();
