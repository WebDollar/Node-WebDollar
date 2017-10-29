import {nodeProtocol, nodeFallBackInterval} from '../../../../consts/const_global.js';

import {NodesWaitlist} from '../../../../node/lists/waitlist/nodes-waitlist.js';
import {NodeProtocol} from './../node-protocol.js';
import {SignalingRoomList} from './../../../../node/lists/signaling-room/signaling-room-list'

class NodeSignalingClientProtocol {

    constructor(){
        console.log("NodeSignalingClientProtocol constructor");
    }

    /*
        Signaling Server Service
     */

    initializeSignalingClientService(webPeer){


        webPeer.on("signals/signal/generate-initiator-signal", data =>{

        });

        webPeer.on("signals/signal/generate-answer-signal", data =>{

        });

        webPeer.on("signals/signal/join-answer-signal", data =>{

        });

    }



    registerSignal(signal){

        node.protocol.broadcastMessageAllSockets("node_propagation", {instruction: "new-address", addresses: addresses });

    }



}

exports.NodeSignalingClientProtocol = new NodeSignalingClientProtocol();
