import {nodeProtocol, nodeFallBackInterval} from '../../../../consts/const_global.js';

import {NodesList} from '../../../../node/lists/nodes-list';
import {NodeSignalingConnectionObject} from './node-signaling-connection-object'
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
                socket.node.protocol.signaling.connections = [];
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
        this.connectWebPeersInterval();
    }

    connectWebPeersInterval(){

        let listAcceptingWebPeerConnections = [] ;

        for (let i=0; i<NodesList.nodes.length; i++)
            if ( (NodesList[i].socket.node.protocol.signaling.acceptingConnections||false) === true)
                listAcceptingWebPeerConnections.push(NodesList[i].socket);

        //mixing users
        for (let i=0; i<listAcceptingWebPeerConnections.length; i++) {

            let webPeer1 = listAcceptingWebPeerConnections[i];
            for (let j = 0; j < listAcceptingWebPeerConnections.length; j++){
                let webPeer2 = listAcceptingWebPeerConnections[j];

                if (webPeer1.socket !== webPeer2.socket) {

                    //previous established connection
                    let previousEstablishedConnection = false;
                    for (let q = 0; q < webPeer1.socket.node.protocol.signaling.connections.length; q++)
                        if (webPeer1.socket.node.protocol.signaling.connections[q] === webPeer2){
                            previousEstablishedConnection = true;
                            break;
                        }

                    if (previousEstablishedConnection === false){

                        webPeer1.socket.sendRequestWaitOnce("signals/signal/generate-initiator-signal", {address: webPeer2.socket.node.sckAddress.getAddress() }).then ((answer)=>{

                            if ( (answer.accepted||false) === true) {
                                webPeer2.socket.sendRequestWaitOnce("signals/signal/generate-answer-signal", {
                                    signal: answer.signal,
                                    address: webPeer1.socket.node.sckAddress.getAddress()
                                }).then ((answer)=>{

                                    webPeer1.socket.sendRequestWaitOnce("signals/signal/join-answer-signal").then( (answer)=>{

                                        if ((answer.established||false) === true){

                                            let signalingConnectionObject = new NodeSignalingConnectionObject(webPeer1, webPeer2);
                                            webPeer1.socket.node.protocol.signaling.connections.push(signalingConnectionObject)
                                        }

                                    });

                                });
                            }

                        });

                    }
                }

            }
        }


        setTimeout(()=>{this.connectWebPeersInterval()}, 2000);
    }

}

exports.NodeSignalingServerProtocol = new NodeSignalingServerProtocol();
