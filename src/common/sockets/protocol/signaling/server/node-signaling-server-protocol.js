const colors = require('colors/safe');
import consts from 'consts/const_global'

import NodesList from 'node/lists/nodes-list'

import SignalingServerRoomList from './signaling-server-room/signaling-server-room-list'
import SignalingServerRoomConnectionObject from './signaling-server-room/signaling-server-room-connection-object'

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

            if ( socket.node.protocol.signaling.server.acceptingConnections === undefined) { //check it is for the first time
                socket.node.protocol.signaling.server.acceptingConnections = true;
            }

        });

        socket.on("signals/server/connections/established-connection-was-dropped", (data)=>{

            if (!data.connectionId){

                let connection = SignalingServerRoomList.searchSignalingServerRoomConnectionById(data.connectionId);
                if (connection  !== null)
                    SignalingServerRoomList.setSignalingServerRoomConnectionStatus(connection.client1, connection.client2, SignalingServerRoomConnectionObject.ConnectionStatus.peerConnectionNotEstablished)

            }


        });

        this.startConnectingWebPeers();

    }

    startConnectingWebPeers(){

        if (this.started === true) return;

        this.started = true;
        this.connectWebPeersInterval();
    }

    connectWebPeersInterval(){

        let listAcceptingWebPeerConnections = [] ;

        for (let i=0; i<NodesList.nodes.length; i++)
            if ( (NodesList.nodes[i].socket.node.protocol.signaling.server.acceptingConnections||false) === true )
                if (NodesList.nodes[i].socket.node.sckAddress.uuid !== undefined)
                    listAcceptingWebPeerConnections.push(NodesList.nodes[i].socket);
                else
                    console.log(colors.red("uuid is empty", NodesList.nodes[i].socket.node.sckAddress));

        if (process.env.DEBUG_SIGNALING_SERVER === 'true')  console.log("listAcceptingWebPeerConnections", listAcceptingWebPeerConnections.length );

        //mixing users
        for (let i=0; i<listAcceptingWebPeerConnections.length; i++) {

            for (let j = 0; j < listAcceptingWebPeerConnections.length; j++){

                // Step 0 , finding two different clients
                // clients are already already with socket
                if ( listAcceptingWebPeerConnections[i] !== listAcceptingWebPeerConnections[j] ) {

                    //shuffling them, the sockets to change the orders
                    let client1, client2 = null;

                    if (Math.random() > 0.5) {
                        client1 = listAcceptingWebPeerConnections[i]; client2 = listAcceptingWebPeerConnections[j];
                    } else {
                        client1 = listAcceptingWebPeerConnections[j]; client2 = listAcceptingWebPeerConnections[i];
                    }

                    let previousEstablishedConnection = SignalingServerRoomList.searchSignalingServerRoomConnection(client1, client2);

                    if (process.env.DEBUG_SIGNALING_SERVER === 'true')  console.log("Step 0 ", typeof client1, typeof client2, typeof previousEstablishedConnection, (previousEstablishedConnection ? previousEstablishedConnection.id : 'no-id'), (previousEstablishedConnection ? previousEstablishedConnection.status : 'no status') );

                    if (previousEstablishedConnection === null
                        || (previousEstablishedConnection.checkLastTimeChecked(60*1000) && previousEstablishedConnection.status === SignalingServerRoomConnectionObject.ConnectionStatus.peerConnectionNotEstablished )
                        || (previousEstablishedConnection.checkLastTimeChecked(60*1000) && previousEstablishedConnection.status === SignalingServerRoomConnectionObject.ConnectionStatus.peerConnectionAlreadyConnected )){

                        let connection = SignalingServerRoomList.setSignalingServerRoomConnectionStatus(client1, client2, SignalingServerRoomConnectionObject.ConnectionStatus.initiatorSignalGenerating );

                        if (process.env.DEBUG_SIGNALING_SERVER === 'true')  console.log("Step 1 - generate-initiator-signal  ", (connection === null ? null : connection.id) , { id: connection.id,  address: client2.node.sckAddress.getAddress() } );

                        // Step1, send the request to generate the INITIATOR SIGNAL
                        client1.node.sendRequestWaitOnce("signals/client/initiator/generate-initiator-signal", {
                            id: connection.id,

                            remoteAddress: client2.node.sckAddress.getAddress(false),
                            remoteUUID: client2.node.sckAddress.uuid,
                        }, connection.id ).then ( (initiatorAnswer) =>{

                            if ( ((initiatorAnswer.accepted||false) === false) && ((initiatorAnswer.message || '') === "Already connected"))
                                SignalingServerRoomList.setSignalingServerRoomConnectionStatus(client1, client2, SignalingServerRoomConnectionObject.ConnectionStatus.peerConnectionAlreadyConnected);
                            else
                            if ( initiatorAnswer.initiatorSignal === undefined )
                                SignalingServerRoomList.setSignalingServerRoomConnectionStatus(client1, client2, SignalingServerRoomConnectionObject.ConnectionStatus.peerConnectionError);
                            else

                            if ( (initiatorAnswer.accepted||false) === true) {

                                SignalingServerRoomList.registerSignalingServerRoomConnection(client1, client2, SignalingServerRoomConnectionObject.ConnectionStatus.answerSignalGenerating );

                                // Step 2, send the Initiator Signal to the 2nd Peer to get ANSWER SIGNAL

                                client2.node.sendRequestWaitOnce("signals/client/answer/receive-initiator-signal", {
                                    id: connection.id,
                                    initiatorSignal: initiatorAnswer.initiatorSignal,

                                    remoteAddress: client1.node.sckAddress.getAddress(false),
                                    remoteUUID: client1.node.sckAddress.uuid,
                                }, connection.id).then((answer)=>{

                                    if ( ((answer.accepted||false) === false) && ((answer.message || '') === "Already connected"))
                                        SignalingServerRoomList.setSignalingServerRoomConnectionStatus(client1, client2, SignalingServerRoomConnectionObject.ConnectionStatus.peerConnectionAlreadyConnected);
                                    else
                                    if ( answer.answerSignal === undefined )
                                        SignalingServerRoomList.setSignalingServerRoomConnectionStatus(client1, client2, SignalingServerRoomConnectionObject.ConnectionStatus.peerConnectionError);
                                    else
                                    if ( (answer.accepted||false) === true) {

                                        if (process.env.DEBUG_SIGNALING_SERVER === 'true')  console.log("Step 2_0 - Answer Signal received  ", connection.id, answer );

                                        SignalingServerRoomList.registerSignalingServerRoomConnection(client1, client2, SignalingServerRoomConnectionObject.ConnectionStatus.peerConnectionEstablishing );

                                        if (process.env.DEBUG_SIGNALING_SERVER === 'true')  console.log("Step 2 - Answer Signal received  ", connection.id, answer );

                                        // Step 3, send the Answer Signal to the 1st Peer (initiator) to establish connection
                                        client1.node.sendRequestWaitOnce("signals/client/initiator/join-answer-signal",{
                                            id: connection.id,
                                            initiatorSignal: initiatorAnswer.initiatorSignal,
                                            answerSignal: answer.answerSignal,

                                            remoteAddress: client2.node.sckAddress.getAddress(false),
                                            remoteUUID: client2.node.sckAddress.uuid,
                                        }, connection.id).then( (result)=>{

                                             if (process.env.DEBUG_SIGNALING_SERVER === 'true')  console.log("Step 4 - join-answer-signal  ", connection.id, result );

                                             if ( ((answer.established||false) === false) && ((answer.message || '') === "Already connected"))
                                                SignalingServerRoomList.setSignalingServerRoomConnectionStatus(client1, client2, SignalingServerRoomConnectionObject.ConnectionStatus.peerConnectionAlreadyConnected);
                                             else {

                                                if ((result.established || false) === true) {

                                                    //connected
                                                    connection.refreshLastTimeConnected();

                                                } else {
                                                    //not connected
                                                    connection.refreshLastTimeErrorChecked();
                                                }
                                            }

                                        });
                                    }

                                    client2.node.on("signals/server/new-answer-ice-candidate/" + connection.id, (iceCandidate) => {

                                        if (process.env.DEBUG_SIGNALING_SERVER === 'true')  console.log("Answer iceCandidate  ", connection.id, iceCandidate );

                                        client1.node.sendRequest("signals/client/initiator/receive-ice-candidate",{
                                            id: connection.id,

                                            initiatorSignal: initiatorAnswer.initiatorSignal,
                                            iceCandidate: iceCandidate,

                                            remoteAddress: client2.node.sckAddress.getAddress(false),
                                            remoteUUID: client2.node.sckAddress.uuid,
                                        });

                                    });



                                });

                                client1.node.on("signals/server/new-initiator-ice-candidate/" + connection.id, (iceCandidate) => {

                                    if (process.env.DEBUG_SIGNALING_SERVER === 'true')  console.log("Initiator iceCandidate  ", connection.id, iceCandidate );

                                    client2.node.sendRequest("signals/client/answer/receive-ice-candidate",{
                                        id: connection.id,

                                        initiatorSignal: initiatorAnswer.initiatorSignal,
                                        iceCandidate: iceCandidate,

                                        remoteAddress: client1.node.sckAddress.getAddress(false),
                                        remoteUUID: client1.node.sckAddress.uuid,
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

export default new NodeSignalingServerProtocol();
