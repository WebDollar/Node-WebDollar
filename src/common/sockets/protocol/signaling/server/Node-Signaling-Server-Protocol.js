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
        //client1
        socket.node.on("signals/client/initiator/generate-initiator-signal/answer", (initiatorAnswer)=>{

            try {
                let connection = SignalingServerRoomList.searchSignalingServerRoomConnectionById(initiatorAnswer.connectionId);

                if (connection === null){
                    console.error("signals/client/initiator/generate-initiator-signal/answer connection is null");
                    return null;
                }

                if (initiatorAnswer === null || initiatorAnswer.initiatorSignal === undefined)
                    connection.status = SignalingServerRoomConnectionObject.ConnectionStatus.peerConnectionError;
                else if (initiatorAnswer.accepted === false && initiatorAnswer.message === "Already connected")
                    connection.status = SignalingServerRoomConnectionObject.ConnectionStatus.peerConnectionAlreadyConnected;
                else if (initiatorAnswer.accepted === false && initiatorAnswer.message === "I can't accept WebPeers anymore")
                    this._clientIsNotAcceptingAnymoreWebPeers(socket, connection);
                else if (initiatorAnswer.accepted === true) {

                    connection.status = SignalingServerRoomConnectionObject.ConnectionStatus.answerSignalGenerating;
                    connection.initiatorSignal = initiatorAnswer.initiatorSignal;

                    // Step 2, send the Initiator Signal to the 2nd Peer to get ANSWER SIGNAL

                    connection.client2.node.sendRequest("signals/client/answer/receive-initiator-signal", {
                        connectionId: connection.id,
                        initiatorSignal: connection.initiatorSignal,

                        remoteAddress: socket.node.sckAddress.getAddress(false),
                        remoteUUID: socket.node.sckAddress.uuid,

                    });

                }

            } catch (exception){
                console.error("signals/client/initiator/generate-initiator-signal/answer exception", exception, initiatorAnswer);
            }

        });

        //client2
        socket.node.on("signals/client/answer/receive-initiator-signal/answer", (answer)=>{

            try {
                let connection = SignalingServerRoomList.searchSignalingServerRoomConnectionById(answer.connectionId);

                if (connection === null){
                    console.error("signals/client/answer/receive-initiator-signal/answer connection is empty", answer.connectionId);
                    return;
                }

                if (answer === null || answer === undefined || answer.answerSignal === undefined)
                    connection.status = SignalingServerRoomConnectionObject.ConnectionStatus.peerConnectionError;
                else if (answer.accepted === false && answer.message === "Already connected")
                    connection.status = SignalingServerRoomConnectionObject.ConnectionStatus.peerConnectionAlreadyConnected;
                else if (answer.accepted === false && answer.message === "I can't accept WebPeers anymore")
                    this._clientIsNotAcceptingAnymoreWebPeers(socket, connection);
                else if (answer.accepted === true) {

                    connection.status = SignalingServerRoomConnectionObject.ConnectionStatus.peerConnectionEstablishing;

                    // Step 3, send the Answer Signal to the 1st Peer (initiator) to establish connection
                    connection.client1.node.sendRequest("signals/client/initiator/join-answer-signal", {
                        connectionId: connection.id,
                        initiatorSignal: answer.initiatorSignal,
                        answerSignal: answer.answerSignal,

                        remoteAddress: socket.node.sckAddress.getAddress(false),
                        remoteUUID: socket.node.sckAddress.uuid,
                    });
                }

            } catch (exception){
                console.error("signals/client/answer/receive-initiator-signal/answer exception", exception, answer);
            }

        });

        // Step 3, send the Answer Signal to the 1st Peer (initiator) to establish connection
        //socket is client1
        socket.on("signals/client/initiator/join-answer-signal", (result)=> {

            try {

                let connection = SignalingServerRoomList.searchSignalingServerRoomConnectionById(result.connectionId);

                if (connection === null){
                    console.error("signals/client/initiator/join-answer-signal connection is empty", result.connectionId);
                    return;
                }

                if (result === null || result === undefined)
                    connection.status = SignalingServerRoomConnectionObject.ConnectionStatus.peerConnectionError;
                else if (result.established === false && result.message === "Already connected")
                    connection.status = SignalingServerRoomConnectionObject.ConnectionStatus.peerConnectionAlreadyConnected;
                else if (result.established === false && result.message === "I can't accept WebPeers anymore")
                    this._clientIsNotAcceptingAnymoreWebPeers(socket, connection);
                else
                    connection.status = SignalingServerRoomConnectionObject.ConnectionStatus.peerConnectionEstablished;

            } catch (exception){
                console.error("signals/client/initiator/join-answer-signal exception",exception,  result);
            }

        });



        //socket is client2
        socket.node.on("signals/server/new-answer-ice-candidate", async (iceCandidate) => {

            try {
                let connection = SignalingServerRoomList.searchSignalingServerRoomConnectionById(iceCandidate.connectionId);

                if (connection === null) {
                    console.error("signals/server/new-answer-ice-candidate connection is empty", iceCandidate.connectionId);
                    return;
                }

                if (iceCandidate === null || iceCandidate === undefined)
                    connection.status = SignalingServerRoomConnectionObject.ConnectionStatus.peerConnectionError;

                await connection.client1.node.sendRequestWaitOnce("signals/client/initiator/receive-ice-candidate", {  //sendRequestWaitOnce returns errors
                    connectionId: connection.id,

                    initiatorSignal: connection.initiatorSignal,
                    iceCandidate: iceCandidate,

                    remoteAddress: socket.node.sckAddress.getAddress(false),
                    remoteUUID: socket.node.sckAddress.uuid,
                });


            } catch (exception){
                console.error("signals/server/new-answer-ice-candidate exception ", exception, iceCandidate);
            }

        });

        //client 1
        socket.node.on("signals/client/initiator/receive-ice-candidate/answer", async (answer) => {
            try {

                let connection = SignalingServerRoomList.searchSignalingServerRoomConnectionById(answer.connectionId);

                if (connection === null) {
                    console.error("signals/server/new-answer-ice-candidate connection is empty", answer.connectionId);
                    return;
                }

                if (answer === null || answer === undefined)
                    connection.status = SignalingServerRoomConnectionObject.ConnectionStatus.peerConnectionError;

                else if (answer.established === false && answer.message === "I can't accept WebPeers anymore")
                    this._clientIsNotAcceptingAnymoreWebPeers(connection.client1, connection);

            } catch (exception){

            }
        });


        //client 1
        socket.node.on("signals/server/new-initiator-ice-candidate", async (iceCandidate) => {

            try {
                let connection = SignalingServerRoomList.searchSignalingServerRoomConnectionById( iceCandidate.connectionId );

                if (connection === null) {
                    console.error("signals/server/new-answer-ice-candidate connection is empty", iceCandidate.connectionId);
                    return;
                }

                let answer = await connection.client2.node.sendRequest("signals/client/answer/receive-ice-candidate", { //sendRequestWaitOnce returns errors
                    connectionId: connection.id,

                    initiatorSignal: connection.initiatorSignal,
                    iceCandidate: iceCandidate,

                    remoteAddress: connection.client1.node.sckAddress.getAddress(false),
                    remoteUUID: connection.client1.node.sckAddress.uuid,
                });

                if (answer === null || answer === undefined)
                    connection.status = SignalingServerRoomConnectionObject.ConnectionStatus.peerConnectionError;
                else if (answer.established === false && answer.message === "I can't accept WebPeers anymore")
                    this._clientIsNotAcceptingAnymoreWebPeers(connection.client2, connection);

            } catch (exception){
                console.error("signals/server/new-initiator-ice-candidate exception ", exception, iceCandidate);
            }

        });


        //client2
        socket.node.on("signals/server/new-initiator-ice-candidate/answer", async (answer) => {

            try {

                let connection = SignalingServerRoomList.searchSignalingServerRoomConnectionById(iceCandidate.connectionId);

                if (answer === null || answer === undefined)
                    connection.status = SignalingServerRoomConnectionObject.ConnectionStatus.peerConnectionError;
                else if (answer.established === false && answer.message === "I can't accept WebPeers anymore")
                    this._clientIsNotAcceptingAnymoreWebPeers(connection.client2, connection);

            } catch (exception){

            }
        });

    }






    connectWebPeer(client1, client2){

        try {

            if (client1 === null || client2 === null) return false;

            let previousEstablishedConnection = SignalingServerRoomList.searchSignalingServerRoomConnection(client1, client2);

            if (previousEstablishedConnection === null
                || (previousEstablishedConnection.checkLastTimeChecked(10 * 1000) && [SignalingServerRoomConnectionObject.ConnectionStatus.peerConnectionNotEstablished].indexOf(previousEstablishedConnection.status) !== -1   )
                || (previousEstablishedConnection.checkLastTimeChecked(20 * 1000) && [SignalingServerRoomConnectionObject.ConnectionStatus.peerConnectionError].indexOf(previousEstablishedConnection.status) !== -1 )) {

                let connection = SignalingServerRoomList.setSignalingServerRoomConnectionStatus(client1, client2, SignalingServerRoomConnectionObject.ConnectionStatus.initiatorSignalGenerating);

                // Step1, send the request to generate the INITIATOR SIGNAL
                client1.node.sendRequest("signals/client/initiator/generate-initiator-signal", {

                    connectionId: connection.id,

                    remoteAddress: client2.node.sckAddress.getAddress(false),
                    remoteUUID: client2.node.sckAddress.uuid,

                });

            }

        } catch (exception){
            console.error("connectWebPeer exception ", exception);
        }

    }

    _clientIsNotAcceptingAnymoreWebPeers(client, connection){

        SignalingServerRoomList.removeServerRoomConnection(connection);
        client.acceptWebPeers = false;

    }



}

export default new NodeSignalingServerProtocol();