import consts from 'consts/const_global'

import NodesList from 'node/lists/Nodes-List'

import SignalingServerRoomList from './signaling-server-room/Signaling-Server-Room-List'
import SignalingServerRoomConnectionObject from './signaling-server-room/Signaling-Server-Room-Connection-Object'
import NodeSignalingServerService from "./signaling-server-service/Node-Signaling-Server-Service"

class NodeSignalingServerProtocol {


    constructor(){

        console.log("NodeSignalingServerProtocol constructor");

       NodeSignalingServerService.startConnectingWebPeers();
    }

    /*
        Signaling Server Service
     */

    initializeSignalingServerService(socket) {

        socket.node.on("signals/server/register/accept-web-peer-connections", (data) => {

            try {

                let acceptWebPeers = false;
                if (typeof data.acceptWebPeers === "boolean") acceptWebPeers = data.acceptWebPeers;

                aNodeSignalingServerService.registerSocketForSignaling(socket, acceptWebPeers);

            } catch (exception){

            }

        });

        socket.node.on("signals/server/connections/established-connection-was-dropped", (data) => {

            try {

                let connection = SignalingServerRoomList.searchSignalingServerRoomConnectionById(data.connectionId);

                if (connection !== undefined) {
                    connection.status = SignalingServerRoomConnectionObject.ConnectionStatus.peerConnectionNotEstablished;

                    let waitlist = NodeSignalingServerService.searchNodeSignalingServerWaitlist(socket);

                    if (waitlist !== null)
                        waitlist.acceptWebPeers = true;

                }

            } catch (exception){

            }

        });


        socket.node.on("signals/server/connections/was-established-successfully", (data) => {

            try {
                if (!data.connectionId) {

                    let connection = SignalingServerRoomList.searchSignalingServerRoomConnectionById(data.connectionId);

                    if (connection !== undefined)
                        connection.status = SignalingServerRoomConnectionObject.ConnectionStatus.peerConnectionEstablished;

                }
            } catch (exception){

            }

        });

        socket.node.on("signals/server/connections/error-establishing-connection", (data) => {

            try {

                if (!data.connectionId) {

                    let connection = SignalingServerRoomList.searchSignalingServerRoomConnectionById(data.connectionId);

                    if (connection !== undefined)
                        connection.status = SignalingServerRoomConnectionObject.ConnectionStatus.peerConnectionError;

                }

            } catch (exception){

            }

        });

        this._initializeClient1(socket);
        this._initializeClient2(socket);


    }

    _initializeClient1(client1) {

        // Step1, send the request to generate the INITIATOR SIGNAL
        //client1
        client1.node.on("signals/client/initiator/generate-initiator-signal/answer", (initiatorAnswer) => {

            try {
                let connection = SignalingServerRoomList.searchSignalingServerRoomConnectionById(initiatorAnswer.connectionId);

                if (connection === undefined) {
                    console.error("signals/client/initiator/generate-initiator-signal/answer connection is null");
                    return;
                }

                if (consts.DEBUG) console.warn("WEBRTC SERVER 1_1", connection.id);

                if (initiatorAnswer === null || initiatorAnswer.initiatorSignal === undefined)
                    connection.status = SignalingServerRoomConnectionObject.ConnectionStatus.peerConnectionError;
                else if (initiatorAnswer.accepted === false && initiatorAnswer.message === "Already connected")
                    connection.status = SignalingServerRoomConnectionObject.ConnectionStatus.peerConnectionAlreadyConnected;
                else if (initiatorAnswer.accepted === false && initiatorAnswer.message === "I can't accept WebPeers anymore")
                    this._clientIsNotAcceptingAnymoreWebPeers(client1, connection);
                else if (initiatorAnswer.accepted === true) {

                    connection.status = SignalingServerRoomConnectionObject.ConnectionStatus.answerSignalGenerating;
                    connection.initiatorSignal = initiatorAnswer.initiatorSignal;

                    // Step 2, send the Initiator Signal to the 2nd Peer to get ANSWER SIGNAL

                    connection.client2.node.sendRequest("signals/client/answer/receive-initiator-signal", {
                        connectionId: connection.id,
                        initiatorSignal: connection.initiatorSignal,

                        remoteAddress: connection.client1.node.sckAddress.getAddress(false),
                        remoteUUID: connection.client1.node.sckAddress.uuid,

                    });

                }

            } catch (exception) {
                console.error("signals/client/initiator/generate-initiator-signal/answer exception", exception, initiatorAnswer);
            }

        });

        // Step 3, send the Answer Signal to the 1st Peer (initiator) to establish connection
        client1.on("signals/client/initiator/join-answer-signal/answer", (result)=> {

            try {

                let connection = SignalingServerRoomList.searchSignalingServerRoomConnectionById(result.connectionId);

                if (connection === undefined){
                    console.error("signals/client/initiator/join-answer-signal/answer connection is empty", result.connectionId);
                    return;
                }

                if (consts.DEBUG) console.warn("WEBRTC SERVER 1_2", connection.id);

                if (result === null || result === undefined)
                    connection.status = SignalingServerRoomConnectionObject.ConnectionStatus.peerConnectionError;
                else if (result.established === false && result.message === "Already connected")
                    connection.status = SignalingServerRoomConnectionObject.ConnectionStatus.peerConnectionAlreadyConnected;
                else if (result.established === false && result.message === "I can't accept WebPeers anymore")
                    this._clientIsNotAcceptingAnymoreWebPeers(client1, connection);
                else
                    connection.status = SignalingServerRoomConnectionObject.ConnectionStatus.peerConnectionEstablished;

            } catch (exception){
                console.error("signals/client/initiator/join-answer-signal/answer exception",exception,  result);
            }

        });


        //client 1
        client1.node.on("signals/server/new-initiator-ice-candidate", async (iceCandidate) => {

            try {
                let connection = SignalingServerRoomList.searchSignalingServerRoomConnectionById( iceCandidate.connectionId );

                if (connection === undefined) {
                    console.error("signals/server/new-answer-ice-candidate connection is empty", iceCandidate.connectionId);
                    return;
                }

                if (consts.DEBUG) console.warn("WEBRTC SERVER 1_3", connection.id);

                connection.client2.node.sendRequest("signals/client/answer/receive-ice-candidate", { //sendRequestWaitOnce returns errors
                    connectionId: connection.id,

                    initiatorSignal: connection.initiatorSignal,
                    iceCandidate: iceCandidate,

                    remoteAddress: connection.client1.node.sckAddress.getAddress(false),
                    remoteUUID: connection.client1.node.sckAddress.uuid,
                });

            } catch (exception){
                console.error("signals/server/new-initiator-ice-candidate exception ", exception, iceCandidate);
            }

        });

        //client 1
        client1.node.on("signals/client/initiator/receive-ice-candidate/answer", async (answer) => {
            try {

                let connection = SignalingServerRoomList.searchSignalingServerRoomConnectionById(answer.connectionId);

                if (connection === undefined) {
                    console.error("signals/server/new-answer-ice-candidate connection is empty", answer.connectionId);
                    return;
                }

                if (consts.DEBUG) console.warn("WEBRTC SERVER 1_4", connection.id);

                if (answer === null || answer === undefined)
                    connection.status = SignalingServerRoomConnectionObject.ConnectionStatus.peerConnectionError;

                else if (answer.established === false && answer.message === "I can't accept WebPeers anymore")
                    this._clientIsNotAcceptingAnymoreWebPeers(client1, connection);

            } catch (exception){

            }
        });



    }

    _initializeClient2(client2){

        //client2
        client2.node.on("signals/client/answer/receive-initiator-signal/answer", (answer)=>{

            try {
                let connection = SignalingServerRoomList.searchSignalingServerRoomConnectionById(answer.connectionId);

                if (connection === undefined){
                    console.error("signals/client/answer/receive-initiator-signal/answer connection is empty", answer.connectionId);
                    return;
                }

                if (consts.DEBUG) console.warn("WEBRTC SERVER 2_1", connection.id);

                if (answer === null || answer === undefined || answer.answerSignal === undefined)
                    connection.status = SignalingServerRoomConnectionObject.ConnectionStatus.peerConnectionError;
                else if (answer.accepted === false && answer.message === "Already connected")
                    connection.status = SignalingServerRoomConnectionObject.ConnectionStatus.peerConnectionAlreadyConnected;
                else if (answer.accepted === false && answer.message === "I can't accept WebPeers anymore")
                    this._clientIsNotAcceptingAnymoreWebPeers(client2, connection);
                else if (answer.accepted === true) {

                    connection.status = SignalingServerRoomConnectionObject.ConnectionStatus.peerConnectionEstablishing;

                    // Step 3, send the Answer Signal to the 1st Peer (initiator) to establish connection
                    connection.client1.node.sendRequest("signals/client/initiator/join-answer-signal", {
                        connectionId: connection.id,
                        initiatorSignal: answer.initiatorSignal,
                        answerSignal: answer.answerSignal,

                        remoteAddress: connection.client2.node.sckAddress.getAddress(false),
                        remoteUUID: connection.client2.node.sckAddress.uuid,
                    });
                }

            } catch (exception){
                console.error("signals/client/answer/receive-initiator-signal/answer exception", exception, answer);
            }

        });


        //socket is client2
        client2.node.on("signals/server/new-answer-ice-candidate", async (iceCandidate) => {

            try {
                let connection = SignalingServerRoomList.searchSignalingServerRoomConnectionById(iceCandidate.connectionId);

                if (connection === undefined) {
                    console.error("signals/server/new-answer-ice-candidate connection is empty", iceCandidate.connectionId);
                    return;
                }

                if (consts.DEBUG) console.warn("WEBRTC SERVER 2_2", connection.id);

                if (iceCandidate === null || iceCandidate === undefined)
                    connection.status = SignalingServerRoomConnectionObject.ConnectionStatus.peerConnectionError;

                connection.client1.node.sendRequest("signals/client/initiator/receive-ice-candidate", {  //sendRequestWaitOnce returns errors

                    connectionId: connection.id,

                    initiatorSignal: connection.initiatorSignal,
                    iceCandidate: iceCandidate,

                    remoteAddress: connection.client2.node.sckAddress.getAddress(false),
                    remoteUUID: connection.client2.node.sckAddress.uuid,

                });


            } catch (exception){
                console.error("signals/server/new-answer-ice-candidate exception ", exception, iceCandidate);
            }

        });



        //client2
        client2.node.on("signals/server/new-initiator-ice-candidate/answer", async (answer) => {

            try {

                let connection = SignalingServerRoomList.searchSignalingServerRoomConnectionById(answer.connectionId);

                if (connection === undefined) {
                    console.error("signals/server/new-initiator-ice-candidate/answer", answer.connectionId);
                    return;
                }

                if (consts.DEBUG) console.warn("WEBRTC SERVER 2_3", connection.id);

                if (answer === null || answer === undefined)
                    connection.status = SignalingServerRoomConnectionObject.ConnectionStatus.peerConnectionError;
                else if (answer.established === false && answer.message === "I can't accept WebPeers anymore")
                    this._clientIsNotAcceptingAnymoreWebPeers(client2, connection);

            } catch (exception){

            }
        });

    }






    connectWebPeer(client1, client2){

        try {

            if (client1 === null || client2 === null) return false;

            let previousEstablishedConnection = SignalingServerRoomList.searchSignalingServerRoomConnection(client1, client2);

            if ( previousEstablishedConnection === undefined
                || (previousEstablishedConnection.checkLastTimeChecked(10 * 1000) && [SignalingServerRoomConnectionObject.ConnectionStatus.peerConnectionNotEstablished].indexOf( previousEstablishedConnection.status ) !== -1   )
                || (previousEstablishedConnection.checkLastTimeChecked(10 * 1000) && [SignalingServerRoomConnectionObject.ConnectionStatus.peerConnectionError].indexOf( previousEstablishedConnection.status ) !== -1 )) {

                let connection = SignalingServerRoomList.registerSignalingServerRoomConnection(client1, client2, SignalingServerRoomConnectionObject.ConnectionStatus.initiatorSignalGenerating);

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