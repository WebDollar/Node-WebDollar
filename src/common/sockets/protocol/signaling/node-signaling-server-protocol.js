import {nodeProtocol, nodeFallBackInterval} from '../../../../consts/const_global.js';

import {NodesList} from '../../../../node/lists/nodes-list';
import {NodeProtocol} from './../node-protocol.js';
import {SignalingRoomList} from './../../../../node/lists/signaling-room/signaling-room-list'

class NodeSignalingServerProtocol {


    constructor(){

        this.started = false;
        console.log("NodeSignalingServerProtocol constructor");
    }

    /*
        Signaling Server Service
     */

    initializeSignalingServerService(socket){

        socket.on("signals/register/accept-web-peer-connections", (data) =>{

            //SignalingRoomList.registerSocketToSignalingRoomList(socket, data.params || {});

            if (typeof socket.node.protocol.signaling.acceptingConnections === 'undefined') { //check it is for the first time
                socket.node.protocol.signaling.acceptingConnections = true;
                socket.node.protocol.signaling.previousConnections = [];
            }

        });

        socket.on("signals/signal/initiator-signal", data =>{

        });

        socket.on("signals/signal/answer-signal", data =>{

        });

        this.startConnectingWebPeers();

    }

    startConnectingWebPeers(){

        if (this.started === true) return;
        this.connectWebPeers();
    }

    connectWebPeers(){

        let listAcceptingConnections = [] ;

        for (let i=0; i<NodesList.nodes.length; i++)
            if ( (NodesList[i].socket.node.protocol.signaling.acceptingConnections||false) === true)
                listAcceptingConnections.push(NodesList[i].socket);

        setTimeout(()=>{this.connectWebPeers()}, 2000);
    }

}

exports.NodeSignalingServerProtocol = new NodeSignalingServerProtocol();
