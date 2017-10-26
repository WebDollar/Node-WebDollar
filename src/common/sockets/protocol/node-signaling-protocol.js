import {nodeProtocol, nodeFallBackInterval} from '../../../consts/const_global.js';

import {NodeWaitlist} from '../../../node/lists/waitlist/node-waitlist.js';
import {NodeProtocol} from './node-protocol.js';

class NodeSignalingProtocol {

    // nodeClientsService = null

    constructor(){
        console.log("NodeSignalingProtocol constructor");
    }


    initializeSocketSignalsAccepting(node){

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
