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

                    let previousEstablishedConnection = this._searchPreviousEstablishedConnection(webPeer1, webPeer2);

                    if (previousEstablishedConnection === null){

                        this._registerPreviousEstablishedConnection(webPeer1, webPeer2, NodeSignalingConnectionObject.ConnectionStatus.initiatorSignalGenerating );

                        webPeer1.socket.sendRequestWaitOnce("signals/signal/generate-initiator-signal", {address: webPeer2.socket.node.sckAddress.getAddress() }).then ((answer)=>{

                            if ( (answer.accepted||false) === true) {

                                this._registerPreviousEstablishedConnection(webPeer1, webPeer2, NodeSignalingConnectionObject.ConnectionStatus.answerSignalGenerating );

                                webPeer2.socket.sendRequestWaitOnce("signals/signal/generate-answer-signal", {
                                    signal: answer.signal,
                                    address: webPeer1.socket.node.sckAddress.getAddress()
                                }).then ((answer)=>{

                                    this._registerPreviousEstablishedConnection(webPeer1, webPeer2, NodeSignalingConnectionObject.ConnectionStatus.peerConnectionEstablishing );

                                    webPeer1.socket.sendRequestWaitOnce("signals/signal/join-answer-signal").then( (answer)=>{

                                        if ((answer.established||false) === true){

                                            let establishedConnection = this._registerPreviousEstablishedConnection(webPeer1, webPeer2, NodeSignalingConnectionObject.ConnectionStatus.peerConnectionEstablished );
                                            establishedConnection.refreshLastTimeConnected();

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

    _searchPreviousEstablishedConnection(webPeer1, webPeer2, skipReverse){

        //previous established connection
        for (let i = 0; i < webPeer1.socket.node.protocol.signaling.connections.length; i++)
            if (webPeer1.socket.node.protocol.signaling.connections[i] === webPeer2){

                return webPeer1.socket.node.protocol.signaling.connections[i];

            }

        if (typeof skipReverse === 'undefined' || skipReverse === false)
            return this._searchPreviousEstablishedConnection(webPeer2, webPeer1, true);

        return null;
    }

    _registerPreviousEstablishedConnection(webPeer1, webPeer2, status ){

        if (webPeer1 === null || webPeer2 === null) return null;

        let connection = this._searchPreviousEstablishedConnection(webPeer1, webPeer2);

        if (connection === null){

            let previousEstablishedConnection = new NodeSignalingConnectionObject(webPeer1, webPeer2, status);

            webPeer1.socket.node.protocol.signaling.connections.push(previousEstablishedConnection);
            webPeer2.socket.node.protocol.signaling.connections.push(previousEstablishedConnection);

        } else {
            //it was established before, now I only change the status
            connection.status = status;
        }

        return connection;
    }

}

exports.NodeSignalingServerProtocol = new NodeSignalingServerProtocol();
