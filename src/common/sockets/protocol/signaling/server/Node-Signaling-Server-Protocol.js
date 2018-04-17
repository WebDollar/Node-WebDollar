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



        // Step1, send the request to generate the INITIATOR SIGNAL
        //socket is client1
        socket.node.on("signals/client/initiator/generate-initiator-signal/answer", (initiatorAnswer)=>{

            let connection = SignalingServerRoomList.searchSignalingServerRoomConnectionById(initiatorAnswer.id);

            if ( initiatorAnswer === null || initiatorAnswer.initiatorSignal === undefined )
                connection.status =  SignalingServerRoomConnectionObject.ConnectionStatus.peerConnectionError;
            else
            if ( initiatorAnswer.accepted === false && initiatorAnswer.message  === "Already connected")
                connection.status  = SignalingServerRoomConnectionObject.ConnectionStatus.peerConnectionAlreadyConnected;
            else
            if ( initiatorAnswer.accepted === false && initiatorAnswer.message === "I can't accept WebPeers anymore") {
                this._clientIsNotAcceptingAnymoreWebPeers(socket, connection);
                return false;
            }
            else

            if ( initiatorAnswer.accepted === true) {

                connection.status = SignalingServerRoomConnectionObject.ConnectionStatus.answerSignalGenerating;
                connection.initiatorSignal = initiatorAnswer.initiatorSignal;

                // Step 2, send the Initiator Signal to the 2nd Peer to get ANSWER SIGNAL

                connection.client2.node.sendRequest("signals/client/answer/receive-initiator-signal", {
                    id: connection.id,
                    initiatorSignal: connection.initiatorSignal,

                    remoteAddress: socket.node.sckAddress.getAddress(false),
                    remoteUUID: socket.node.sckAddress.uuid,

                });

            }

        });

        //socket is client2
        socket.node.on("signals/client/answer/receive-initiator-signal/answer", (answer)=>{

            let connection = SignalingServerRoomList.searchSignalingServerRoomConnectionById(answer.id);

            if ( answer === null || answer === undefined || answer.answerSignal === undefined )
                connection.status = SignalingServerRoomConnectionObject.ConnectionStatus.peerConnectionError;
            else
            if ( answer.accepted === false && answer.message === "Already connected")
                connection.status = SignalingServerRoomConnectionObject.ConnectionStatus.peerConnectionAlreadyConnected;
            else
            if ( answer.accepted === false && answer.message === "I can't accept WebPeers anymore") {
                this._clientIsNotAcceptingAnymoreWebPeers(socket, connection);
                return false;
            }
            else
            if ( answer.accepted === true) {

                connection.status = SignalingServerRoomConnectionObject.ConnectionStatus.peerConnectionEstablishing;

                // Step 3, send the Answer Signal to the 1st Peer (initiator) to establish connection
                connection.client1.node.sendRequest("signals/client/initiator/join-answer-signal", {
                    id: connection.id,
                    initiatorSignal: answer.initiatorSignal,
                    answerSignal: answer.answerSignal,

                    remoteAddress: socket.node.sckAddress.getAddress(false),
                    remoteUUID: socket.node.sckAddress.uuid,
                });
            }

        });

        // Step 3, send the Answer Signal to the 1st Peer (initiator) to establish connection
        //socket is client1
        socket.on("signals/client/initiator/join-answer-signal", (result)=> {

            let connection = SignalingServerRoomList.searchSignalingServerRoomConnectionById(result.id);

            if ( result === null || result === undefined )
                connection.status = SignalingServerRoomConnectionObject.ConnectionStatus.peerConnectionError;
            else
            if ( result.established === false && result.message === "Already connected")
                connection.status = SignalingServerRoomConnectionObject.ConnectionStatus.peerConnectionAlreadyConnected;
            else
            if ( result.established === false && result.message === "I can't accept WebPeers anymore") {
                this._clientIsNotAcceptingAnymoreWebPeers(socket, connection);
                return false;
            } else
                connection.status = SignalingServerRoomConnectionObject.ConnectionStatus.peerConnectionEstablished;

        });



        //socket is client2
        socket.node.on("signals/server/new-answer-ice-candidate", async (iceCandidate) => {

            let connection = SignalingServerRoomList.searchSignalingServerRoomConnectionById(result.id);

            let answer = await connection.client1.node.sendRequest("signals/client/initiator/receive-ice-candidate",{  //sendRequestWaitOnce returns errors
                id: connection.id,

                initiatorSignal: connection.initiatorSignal,
                iceCandidate: iceCandidate,

                remoteAddress: socket.node.sckAddress.getAddress(false),
                remoteUUID: socket.node.sckAddress.uuid,
            });


            if ( answer === null || answer === undefined )
                connection.status = SignalingServerRoomConnectionObject.ConnectionStatus.peerConnectionError;
            else
            if ( answer.established === false && answer.message === "I can't accept WebPeers anymore") {
                this._clientIsNotAcceptingAnymoreWebPeers(connection.client1, connection);
                return false;
            }

        });


        //client 1
        socket.node.on("signals/server/new-initiator-ice-candidate", async (iceCandidate) => {

            let connection = SignalingServerRoomList.searchSignalingServerRoomConnectionById(result.id);

            let answer = await connection.client1.node.sendRequest("signals/client/answer/receive-ice-candidate",{ //sendRequestWaitOnce returns errors
                id: connection.id,

                initiatorSignal: connection.initiatorSignal,
                iceCandidate: iceCandidate,

                remoteAddress: connection.client2.node.sckAddress.getAddress(false),
                remoteUUID: connection.client2.node.sckAddress.uuid,
            });

            if ( answer === null || answer === undefined )
                connection.status = SignalingServerRoomConnectionObject.ConnectionStatus.peerConnectionError;
            else
            if ( answer.established === false && answer.message === "I can't accept WebPeers anymore") {
                this._clientIsNotAcceptingAnymoreWebPeers(connection.client2, connection);
                return false;
            }

        });


    }






    connectWebPeer(client1, client2){

        let previousEstablishedConnection = SignalingServerRoomList.searchSignalingServerRoomConnection(client1, client2);

        if ( previousEstablishedConnection === null
            || (previousEstablishedConnection.checkLastTimeChecked(10*1000) && [ SignalingServerRoomConnectionObject.ConnectionStatus.peerConnectionNotEstablished].indexOf( previousEstablishedConnection.status) !== -1   )
            || (previousEstablishedConnection.checkLastTimeChecked(20*1000) && [ SignalingServerRoomConnectionObject.ConnectionStatus.peerConnectionError ].indexOf( previousEstablishedConnection.status) !== -1 )) {

            let connection = SignalingServerRoomList.setSignalingServerRoomConnectionStatus(client1, client2, SignalingServerRoomConnectionObject.ConnectionStatus.initiatorSignalGenerating );

            // Step1, send the request to generate the INITIATOR SIGNAL
            client1.node.sendRequest("signals/client/initiator/generate-initiator-signal", {

                id: connection.id,

                remoteAddress: client2.node.sckAddress.getAddress(false),
                remoteUUID: client2.node.sckAddress.uuid,

            });

        }

    }

    _clientIsNotAcceptingAnymoreWebPeers(client, connection){

        SignalingServerRoomList.removeServerRoomConnection(connection);
        client.acceptWebPeers = false;

    }



}

export default new NodeSignalingServerProtocol();