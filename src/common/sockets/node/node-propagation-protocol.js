import {NodeClient} from '../../../node/clients/sockets/node-client.js';
import {nodeProtocol, nodeFallBackInterval} from '../../../consts/const_global.js';
import {NodeClientsService} from '../../../node/clients/service/node-clients-service.js';
import {NodeClientsWaitlist} from '../../../node/lists/waitlist/node-clients-waitlist.js';

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

            console.log("NodePropagation",  socket.address);

            let instruction = response.instruction||'';
            switch (instruction){
                case "new-address":

                    let addresses =  response.addresses || [];
                    if (Array.isArray(addresses)){

                        for (let i=0; i<addresses.length; i++){
                            let address = addresses[i];
                            NodeClientsWaitlist.addNewNodeToWaitlist(address);
                        }
                    }

                    break;
            }

        });

    }

    propagade



}

exports.NodePropagationProtocol = new NodePropagationProtocol();

