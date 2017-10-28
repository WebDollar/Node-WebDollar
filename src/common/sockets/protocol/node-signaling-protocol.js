import {nodeProtocol, nodeFallBackInterval} from '../../../consts/const_global.js';

import {NodesWaitlist} from '../../../node/lists/waitlist/nodes-waitlist.js';
import {NodeProtocol} from './node-protocol.js';

class NodeSignalingProtocol {

    // nodeClientsService = null

    constructor(){
        console.log("NodeSignalingProtocol constructor");
    }


    initializeSocketSignalingService(node){

        node.on("signals/register-web-peer-for-accepting-connections", (data) =>{

            node.protocol.signaling.clients.push()

        });

        node.on("signals/initialize", answer =>{

        });

        node.on("signals/signal/join", answer =>{

        });

    }

    registerSignal(signal){

        node.protocol.broadcastMessageAllSockets("node_propagation", {instruction: "new-address", addresses: addresses });

    }



}

exports.NodeSignalingProtocol = new NodeSignalingProtocol();
