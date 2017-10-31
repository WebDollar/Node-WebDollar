import {nodeProtocol, nodeFallBackInterval} from '../../../../../consts/const_global.js';

import {NodesList} from '../../../../../node/lists/nodes-list';

import {SignalingServerRoomList} from './signaling-server-room/signaling-server-room-list'

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
                socket.node.protocol.signaling.server.roomList = new SignalingServerRoomList();
            }

        });

        socket.on("signals/server/initiator-signal", data =>{

        });

        socket.on("signals/server/answer-signal", data =>{

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
            if ( (NodesList[i].socket.node.protocol.signaling.server.acceptingConnections||false) === true)
                listAcceptingWebPeerConnections.push(NodesList[i].socket);


        //mixing users
        for (let i=0; i<listAcceptingWebPeerConnections.length; i++) {

            let webPeer1 = listAcceptingWebPeerConnections[i];
            for (let j = 0; j < listAcceptingWebPeerConnections.length; j++){
                let webPeer2 = listAcceptingWebPeerConnections[j];

                if (webPeer1.socket !== webPeer2.socket) {

                    let previousEstablishedConnection = this._searchEstablishedConnection(webPeer1, webPeer2);

                    if (previousEstablishedConnection === null){

                        let connection = this._registerEstablishedConnection(webPeer1, webPeer2, NodeSignalingConnectionObject.ConnectionStatus.initiatorSignalGenerating );

                        // Step1, send the request to generate the INITIATOR SIGNAL
                        webPeer1.socket.sendRequestWaitOnce("signals/client/generate-initiator-signal", {
                            id: connection.id,
                            address: webPeer2.socket.node.sckAddress.getAddress()
                        }, connection.id ).then ( (initiatorAnswer)=>{

                            if ( (initiatorAnswer.accepted||false) === true) {

                                this._registerEstablishedConnection(webPeer1, webPeer2, NodeSignalingConnectionObject.ConnectionStatus.answerSignalGenerating );

                                // Step 2, send the Initiator Signal to the 2nd Peer to get ANSWER SIGNAL
                                webPeer2.socket.sendRequestWaitOnce("signals/client/generate-answer-signal", {
                                    id: connection.id,
                                    initiatorSignal: initiatorAnswer.initiatorSignal,
                                    address: webPeer1.socket.node.sckAddress.getAddress()
                                }, connection.id).then ((answer)=>{

                                    if ( (answer.accepted||false) === true) {

                                        this._registerEstablishedConnection(webPeer1, webPeer2, NodeSignalingConnectionObject.ConnectionStatus.peerConnectionEstablishing );

                                        // Step 3, send the Answer Signal to the 1st Peer (initiator) to establish connection
                                        webPeer1.socket.sendRequestWaitOnce("signals/client/join-answer-signal",{
                                            id: connection.id,
                                            initiatorSignal: initiatorAnswer.initiatorSignal,
                                            answerSignal: answer.answerSignal,
                                        }, connection.id).then( (answer)=>{

                                            if ((answer.established||false) === true){

                                                let establishedConnection = this._registerEstablishedConnection(webPeer1, webPeer2, NodeSignalingConnectionObject.ConnectionStatus.peerConnectionEstablished );
                                                establishedConnection.refreshLastTimeConnected();

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
