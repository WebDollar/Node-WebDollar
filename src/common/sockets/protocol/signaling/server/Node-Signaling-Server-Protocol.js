import consts from 'consts/const_global'

import NodesList from 'node/lists/nodes-list'

import SignalingServerRoomList from './signaling-server-room/signaling-server-room-list'
import SignalingServerRoomConnectionObject from './signaling-server-room/signaling-server-room-connection-object'
import NodeSignalingServerService from "./signaling-server-service/Node-Signaling-Server-Service"

class NodeSignalingServerProtocol {


    constructor(){

        console.log("NodeSignalingServerProtocol constructor");

       NodeSignalingServerService.startConnectingWebPeers();
    }

    /*
        Signaling Server Service
     */

    initializeSignalingServerService(socket){

        socket.node.on("signals/server/register/accept-web-peer-connections", (data) =>{

            let acceptWebPeers = false;
            if (typeof data.acceptWebPeers === "boolean") acceptWebPeers = data.acceptWebPeers;

            NodeSignalingServerService.registerSocketForSignaling(socket, acceptWebPeers );

        });

        socket.node.on("signals/server/connections/established-connection-was-dropped", (data)=>{

            if (!data.connectionId){

                let connection = SignalingServerRoomList.searchSignalingServerRoomConnectionById(data.connectionId);

                if (connection  !== null)
                    SignalingServerRoomList.setSignalingServerRoomConnectionStatus(connection.client1, connection.client2, SignalingServerRoomConnectionObject.ConnectionStatus.peerConnectionNotEstablished)

            }


        });


        socket.node.on("signals/server/connections/was-established-successfully", (data)=>{

            if (!data.connectionId){

                let connection = SignalingServerRoomList.searchSignalingServerRoomConnectionById(data.connectionId);

                if (connection  !== null)
                    SignalingServerRoomList.setSignalingServerRoomConnectionStatus(connection.client1, connection.client2, SignalingServerRoomConnectionObject.ConnectionStatus.peerConnectionEstablished)

            }

        });

        socket.node.on("signals/server/connections/error-establishing-connection", (data)=>{

            if (!data.connectionId){

                let connection = SignalingServerRoomList.searchSignalingServerRoomConnectionById(data.connectionId);

                if (connection  !== null)
                    SignalingServerRoomList.setSignalingServerRoomConnectionStatus(connection.client1, connection.client2, SignalingServerRoomConnectionObject.ConnectionStatus.peerConnectionError)

            }

        });


    }






    connectWebPeer(client1, client2){


        let previousEstablishedConnection = SignalingServerRoomList.searchSignalingServerRoomConnection(client1, client2);

        if (previousEstablishedConnection === null
            || (previousEstablishedConnection.checkLastTimeChecked(10*1000) && [ SignalingServerRoomConnectionObject.ConnectionStatus.peerConnectionNotEstablished].indexOf( previousEstablishedConnection.status) !== -1   )
            || (previousEstablishedConnection.checkLastTimeChecked(20*1000) && [ SignalingServerRoomConnectionObject.ConnectionStatus.peerConnectionError ].indexOf( previousEstablishedConnection.status) !== -1 )){

            let connection = SignalingServerRoomList.setSignalingServerRoomConnectionStatus(client1, client2, SignalingServerRoomConnectionObject.ConnectionStatus.initiatorSignalGenerating );

            // Step1, send the request to generate the INITIATOR SIGNAL
            client1.node.sendRequestWaitOnce("signals/client/initiator/generate-initiator-signal", {

                id: connection.id,

                remoteAddress: client2.node.sckAddress.getAddress(false),
                remoteUUID: client2.node.sckAddress.uuid,

            }, connection.id ).then ( (initiatorAnswer) =>{

                if ( initiatorAnswer === null || initiatorAnswer.initiatorSignal === undefined )
                    connection.status =  SignalingServerRoomConnectionObject.ConnectionStatus.peerConnectionError;
                else
                if ( initiatorAnswer.accepted === false && initiatorAnswer.message  === "Already connected")
                    connection.status  = SignalingServerRoomConnectionObject.ConnectionStatus.peerConnectionAlreadyConnected;
                else
                if ( initiatorAnswer.accepted === false && initiatorAnswer.message === "I can't accept WebPeers anymore") {
                    this.clientIsNotAcceptingAnymoreWebPeers(client1, connection);
                    return false;
                }
                else

                if ( initiatorAnswer.accepted === true) {

                    SignalingServerRoomList.registerSignalingServerRoomConnection(client1, client2, SignalingServerRoomConnectionObject.ConnectionStatus.answerSignalGenerating );

                    // Step 2, send the Initiator Signal to the 2nd Peer to get ANSWER SIGNAL

                    client2.node.sendRequestWaitOnce("signals/client/answer/receive-initiator-signal", {
                        id: connection.id,
                        initiatorSignal: initiatorAnswer.initiatorSignal,

                        remoteAddress: client1.node.sckAddress.getAddress(false),
                        remoteUUID: client1.node.sckAddress.uuid,

                    }, connection.id).then((answer)=>{

                        if ( answer === null || answer === undefined || answer.answerSignal === undefined )
                            connection.status = SignalingServerRoomConnectionObject.ConnectionStatus.peerConnectionError;
                        else
                        if ( answer.accepted === false && answer.message === "Already connected")
                            connection.status = SignalingServerRoomConnectionObject.ConnectionStatus.peerConnectionAlreadyConnected;
                        else
                        if ( answer.accepted === false && answer.message === "I can't accept WebPeers anymore") {
                            this.clientIsNotAcceptingAnymoreWebPeers(client2, connection);
                            return false;
                        }
                        else
                        if ( answer.accepted === true) {


                            SignalingServerRoomList.registerSignalingServerRoomConnection(client1, client2, SignalingServerRoomConnectionObject.ConnectionStatus.peerConnectionEstablishing );


                            // Step 3, send the Answer Signal to the 1st Peer (initiator) to establish connection
                            client1.node.sendRequestWaitOnce("signals/client/initiator/join-answer-signal",{
                                id: connection.id,
                                initiatorSignal: initiatorAnswer.initiatorSignal,
                                answerSignal: answer.answerSignal,

                                remoteAddress: client2.node.sckAddress.getAddress(false),
                                remoteUUID: client2.node.sckAddress.uuid,
                            }, connection.id).then( (result)=>{


                                if ( result === null || result === undefined )
                                    connection.status = SignalingServerRoomConnectionObject.ConnectionStatus.peerConnectionError;
                                else
                                if ( answer.established === false && answer.message === "Already connected")
                                    connection.status = SignalingServerRoomConnectionObject.ConnectionStatus.peerConnectionAlreadyConnected;
                                else
                                if ( answer.established === false && initiatorAnswer.message === "I can't accept WebPeers anymore") {
                                    this.clientIsNotAcceptingAnymoreWebPeers(client1, connection);
                                    return false;
                                }

                            });
                        }

                        client2.node.on("signals/server/new-answer-ice-candidate/" + connection.id, async (iceCandidate) => {

                            await client1.node.sendRequest("signals/client/initiator/receive-ice-candidate",{  //sendRequestWaitOnce returns errors
                                id: connection.id,

                                initiatorSignal: initiatorAnswer.initiatorSignal,
                                iceCandidate: iceCandidate,

                                remoteAddress: client2.node.sckAddress.getAddress(false),
                                remoteUUID: client2.node.sckAddress.uuid,
                            }, "connection.id");


                            // if ( answer === null || answer === undefined )
                            //     connection.status = SignalingServerRoomConnectionObject.ConnectionStatus.peerConnectionError;
                            // else
                            // if ( answer.established === false && initiatorAnswer.message === "I can't accept WebPeers anymore") {
                            //     this.clientIsNotAcceptingAnymoreWebPeers(client2, connection);
                            //     return false;
                            // }

                        });


                    });

                    client1.node.on("signals/server/new-initiator-ice-candidate/" + connection.id, async (iceCandidate) => {


                        await client2.node.sendRequest("signals/client/answer/receive-ice-candidate",{ //sendRequestWaitOnce returns errors
                            id: connection.id,

                            initiatorSignal: initiatorAnswer.initiatorSignal,
                            iceCandidate: iceCandidate,

                            remoteAddress: client1.node.sckAddress.getAddress(false),
                            remoteUUID: client1.node.sckAddress.uuid,
                        });

                        // if ( answer === null || answer === undefined )
                        //     connection.status = SignalingServerRoomConnectionObject.ConnectionStatus.peerConnectionError;
                        // else
                        // if ( answer.established === false && initiatorAnswer.message === "I can't accept WebPeers anymore") {
                        //     this.clientIsNotAcceptingAnymoreWebPeers(client2, connection);
                        //     return false;
                        // }

                    });


                }

            });

        }

    }

    clientIsNotAcceptingAnymoreWebPeers(client, connection){

        SignalingServerRoomList.removeServerRoomConnection(connection);
        client.acceptWebPeers = false;

    }



}

export default new NodeSignalingServerProtocol();