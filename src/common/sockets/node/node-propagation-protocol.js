import {nodeProtocol, nodeFallBackInterval} from '../../../consts/const_global.js';

import {NodeWaitlist} from '../../../node/lists/waitlist/node-waitlist.js';
import {NodeProtocol} from './node-protocol.js';

class NodePropagationProtocol {

    // nodeClientsService = null

    constructor(){

        console.log("NodePropagation constructor");

    }


    initializeSocketForPropagation(socket){

        socket.once("node_propagation", response => {

            /*
                sample data
                {
                    "instruction": "new-address",
                    "addresses": []
                }
             */

            console.log("NodePropagation",  socket.sckAddress.toString());

            let instruction = response.instruction||'';
            switch (instruction){
                case "new-address":

                    let addresses =  response.addresses || [];
                    if (Array.isArray(addresses)){

                        for (let i=0; i<addresses.length; i++){
                            let address = addresses[i];
                            NodeWaitlist.addNewNodeToWaitlist(address);
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

exports.NodePropagationProtocol = new NodePropagationProtocol();

