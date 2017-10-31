import {nodeProtocol, nodeFallBackInterval} from '../../../../../consts/const_global.js';

import {NodesList} from '../../../../../node/lists/nodes-list';

import {SignalingServerRoomList} from './signaling-server-room/signaling-server-room-list'
import {SignalingServerRoomConnectionObject} from './signaling-server-room/signaling-server-room-connection-object'

class NodeSignalingServerProtocol {


    constructor(){

        this.started = false;

        console.log("NodeSignalingServerProtocol constructor");
    }

    /*
        Signaling Server Service
     */

    initializeSignalingServerService(socket){

        socket.on("signals/server/register/accept-web-peer-connections", (data) =>{

            if (typeof socket.node.protocol.signaling.server.acceptingConnections === 'undefined') { //check it is for the first time
                socket.node.protocol.signaling.server.acceptingConnections = true;
            }

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
            if ( (NodesList[i].socket.node.protocol.signaling.server.acceptingConnections||false) === true )
                listAcceptingWebPeerConnections.push(NodesList[i].socket);

        //mixing users
        for (let i=0; i<listAcceptingWebPeerConnections.length; i++) {

            let webPeer1 = listAcceptingWebPeerConnections[i];
            for (let j = 0; j < listAcceptingWebPeerConnections.length; j++){
                let webPeer2 = listAcceptingWebPeerConnections[j];

                if ( webPeer1.socket !== webPeer2.socket ) {

                    let previousEstablishedConnection = SignalingServerRoomList.searchSignalingServerRoomConnection(webPeer1, webPeer2);

                    if (previousEstablishedConnection === null){

                        let connection = SignalingServerRoomList.registerSignalingServerRoomConnection(webPeer1, webPeer2, SignalingServerRoomConnectionObject.ConnectionStatus.initiatorSignalGenerating );

                        // Step1, send the request to generate the INITIATOR SIGNAL
                        webPeer1.socket.sendRequestWaitOnce("signals/client/generate-initiator-signal", {
                            id: connection.id,
                            address: webPeer2.socket.node.sckAddress.getAddress()
                        }, connection.id ).then ( (initiatorAnswer)=>{

                            if ( (initiatorAnswer.accepted||false) === true) {

                                SignalingServerRoomList.registerSignalingServerRoomConnection(webPeer1, webPeer2, SignalingServerRoomConnectionObject.ConnectionStatus.answerSignalGenerating );

                                // Step 2, send the Initiator Signal to the 2nd Peer to get ANSWER SIGNAL
                                webPeer2.socket.sendRequestWaitOnce("signals/client/generate-answer-signal", {
                                    id: connection.id,
                                    initiatorSignal: initiatorAnswer.initiatorSignal,
                                    address: webPeer1.socket.node.sckAddress.getAddress()
                                }, connection.id).then ((answer)=>{

                                    if ( (answer.accepted||false) === true) {

                                        SignalingServerRoomList.registerSignalingServerRoomConnection(webPeer1, webPeer2, SignalingServerRoomConnectionObject.ConnectionStatus.peerConnectionEstablishing );

                                        // Step 3, send the Answer Signal to the 1st Peer (initiator) to establish connection
                                        webPeer1.socket.sendRequestWaitOnce("signals/client/join-answer-signal",{
                                            id: connection.id,
                                            initiatorSignal: initiatorAnswer.initiatorSignal,
                                            answerSignal: answer.answerSignal,
                                        }, connection.id).then( (answer)=>{

                                            if ((answer.established||false) === true){

                                                SignalingServerRoomList.registerSignalingServerRoomConnection(webPeer1, webPeer2, SignalingServerRoomConnectionObject.ConnectionStatus.peerConnectionEstablished );
                                                connection.refreshLastTimeConnected();

                                            } else {
                                                //not connected
                                                SignalingServerRoomList.registerSignalingServerRoomConnection(webPeer1, webPeer2, SignalingServerRoomConnectionObject.ConnectionStatus.peerConnectionNotEstablished);
                                            }

                                        });
                                    }

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
