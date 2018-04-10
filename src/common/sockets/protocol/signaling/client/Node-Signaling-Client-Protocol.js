import consts from 'consts/const_global'

import SignalingClientList from './signaling-client-list/signaling-client-list'
import NodesList from 'node/lists/nodes-list'
import NodeSignalingClientSerivce from "./signaling-client-service/Node-Signaling-Client-Service"

class NodeSignalingClientProtocol {

    constructor(){

        console.log("NodeSignalingClientProtocol constructor");
    }

    _initializeSimpleProtocol(socket){

        socket.node.on("signals/client/do-you-have-free-room", (data)=>{

            socket.node.sendRequest("signals/client/do-you-have-free-room"+"/answer", {
                result: true,
                acceptWebPeers: SignalingClientList.connected.length < consts.SETTINGS.PARAMS.CONNECTIONS.WEBRTC.MAXIMUM_CONNECTIONS,
            })

        })

    }

    /*
        Signaling Server Service
     */

    //initiator
    _initializeSignalingClientService1(socket){

        //TODO protocol to request to connect me with somebody

        socket.node.on("signals/client/initiator/generate-initiator-signal", async (data) => {

            try{
                if (data.remoteUUID === undefined || data.remoteUUID === null)
                    throw {message: "remoteUUID was not specified"};

                //search if the new protocol was already connected in the past
                if (NodesList.searchNodeSocketByAddress(data.remoteUUID, 'all', ["uuid"] ) !== null) //already connected in the past
                    throw {message: "Already connected"};

                if (SignalingClientList.searchWebPeerSignalingClientList(undefined, undefined, data.remoteUUID) !== null)
                    throw {message: "Already connected"};

                if (SignalingClientList.connected.length > SignalingClientList.computeMaxWebPeersConnected( data.remoteUUID ))
                    throw {message: "I can not accept connections anymore" };



                let webPeerSignalingClientListObject = SignalingClientList.registerWebPeerSignalingClientListBySignal(undefined, undefined, data.remoteUUID);
                let webPeer = webPeerSignalingClientListObject.webPeer;

                if (webPeer.peer === null){
                    webPeer.createPeer(true, socket, data.id, (iceCandidate) => {this.sendInitiatorIceCandidate(socket, data.id, iceCandidate) }, data.remoteAddress, data.remoteUUID, socket.level+1);
                    webPeer.peer.signalInitiatorData = data.initiatorSignal;
                }

                let answer;

                answer = await webPeer.createSignalInitiator();

                if (!answer.result )
                    throw {message: "Failed to Get a initiatorSignal: " +answer.message};

                socket.node.sendRequest("signals/client/initiator/generate-initiator-signal/" + data.id, {accepted: true, initiatorSignal: answer.signal});

            } catch (exception){
                console.error("signals/client/initiator/generate-initiator-signal", exception);
                socket.node.sendRequest("signals/client/initiator/generate-initiator-signal/" + data.id, {accepted:false, initiatorSignal: undefined, message: exception.message });
            }

        });

        socket.node.on("signals/client/initiator/join-answer-signal", async (data) => {

            try {
                if (data.remoteUUID === undefined || data.remoteUUID === null)
                    throw {message: "remoteUUID was not specified"};

                //search if the new protocol was already connected in the past
                if (NodesList.searchNodeSocketByAddress(data.remoteUUID, 'all', ["uuid"]) !== null) //already connected in the past
                    throw {message: "Already Connected"};

                if (SignalingClientList.connected.length > SignalingClientList.computeMaxWebPeersConnected( data.remoteUUID ))
                    throw {message: "I can't accept WebPeers anymore"};



                let webPeerSignalingClientListObject = SignalingClientList.searchWebPeerSignalingClientList(data.initiatorSignal, undefined, data.remoteUUID);
                let webPeer = webPeerSignalingClientListObject.webPeer;

                let answer = await webPeer.joinAnswer(data.answerSignal);

                socket.node.sendRequest("signals/client/initiator/join-answer-signal/" + data.id, {established: false, answer: answer });

            } catch (exception){

                console.error("signals/client/initiator/join-answer-signal/" + data.id, exception);
                socket.node.sendRequest("signals/client/initiator/join-answer-signal/" + data.id, {established: false, message: exception.message });

            }

        });

        socket.node.on("signals/client/initiator/receive-ice-candidate", async (data) => {

            try {
                if (data.remoteUUID === undefined || data.remoteUUID === null)
                    throw {message: "data.remoteUUID 4 was not specified"};

                if (data.iceCandidate === undefined)
                    throw {message: "data.iceCandidate 4 was not specified"};

                //search if the new protocol was already connected in the past
                if (NodesList.searchNodeSocketByAddress(data.remoteUUID, 'all', ["uuid"]) !== null) //already connected in the past
                    throw {message: "Already connected"};

                if (SignalingClientList.connected.length > SignalingClientList.computeMaxWebPeersConnected( data.remoteUUID ))
                    throw {message: "I can't accept WebPeers anymore"};



                let webPeerSignalingClientListObject = SignalingClientList.searchWebPeerSignalingClientList(data.initiatorSignal, undefined, data.remoteUUID);
                let webPeer = webPeerSignalingClientListObject.webPeer;

                //arrived earlier than  /receive-initiator-signal
                if (webPeer.peer === null) {
                    webPeer.createPeer(false, socket, data.id, (iceCandidate) => { this.sendInitiatorIceCandidate(socket, data.id, iceCandidate) }, data.remoteAddress, data.remoteUUID, socket.level + 1);
                    webPeer.peer.signalInitiatorData = data.initiatorSignal;
                }

                let answer = await webPeer.createSignal(data.iceCandidate);

                if (!answer.result )
                    throw {message: answer.message};

                socket.node.sendRequest("signals/client/initiator/receive-ice-candidate/" + data.id, {accepted: true, answerSignal: answer.signal} );

            } catch (exception){
                console.error("signals/client/initiator/receive-ice-candidate/" + data.id, exception);
                socket.node.sendRequest("signals/client/initiator/receive-ice-candidate/" + data.id, { accepted: false,  message: exception.message });
            }

        });

    }

    //answer
    _initializeSignalingClientService2(socket){

        socket.node.on("signals/client/answer/receive-initiator-signal", async (data) => {

            try {
                if (data.remoteUUID === undefined || data.remoteUUID === null)
                    throw {message: "data.remoteUUID 2 was not specified"}

                //search if the new protocol was already connected in the past
                if (NodesList.searchNodeSocketByAddress(data.remoteUUID, 'all', ["uuid"]) !== null) //already connected in the past
                    throw {message: "Already connected"};

                if (SignalingClientList.searchWebPeerSignalingClientList(data.initiatorSignal, undefined, data.remoteUUID) !== null)
                    throw {message: "Already connected"};

                if (SignalingClientList.connected.length > SignalingClientList.computeMaxWebPeersConnected( data.remoteUUID ))
                    throw {message: "I can't accept WebPeers anymore" };



                let webPeerSignalingClientListObject = SignalingClientList.registerWebPeerSignalingClientListBySignal( data.initiatorSignal, undefined , data.remoteUUID );
                let webPeer = webPeerSignalingClientListObject.webPeer;

                if (webPeer.peer === null) { //arrived earlier than  /receive-initiator-signal
                    webPeer.createPeer(false, socket, data.id, (iceCandidate) => {this.sendAnswerIceCandidate(socket, data.id, iceCandidate)}, data.remoteAddress, data.remoteUUID, socket.level + 1);
                    webPeer.peer.signalInitiatorData = data.initiatorSignal;
                }

                let answer = await webPeer.createSignal(data.initiatorSignal);

                if (answer.signal === undefined)
                    console.log("WEBRTC 2 is not supported !!!!", answer);

                if (!answer.result )
                    throw {message: answer.message };

                socket.node.sendRequest("signals/client/answer/receive-initiator-signal/" + data.id, {accepted: true, answerSignal: answer.signal} );

            } catch (exception){
                console.error("signals/client/answer/receive-initiator-signal", exception);
                socket.node.sendRequest("signals/client/answer/receive-initiator-signal/" + data.id, {accepted:false, answerSignal: undefined });
            }

        });

        socket.node.on("signals/client/answer/receive-ice-candidate", async (data) => {

            try{

                if (data.remoteUUID === undefined || data.remoteUUID === null)
                    throw {message: "data.remoteUUID 3 is empty"};

                //search if the new protocol was already connected in the past
                if (NodesList.searchNodeSocketByAddress(data.remoteUUID, 'all', ["uuid"] ) !== null) //already connected in the past
                    throw {message: "Already connected" };

                if ( SignalingClientList.connected.length > SignalingClientList.computeMaxWebPeersConnected( data.remoteUUID ) )
                    throw {message: "I can't accept WebPeers anymore" }



                let webPeerSignalingClientListObject = SignalingClientList.searchWebPeerSignalingClientList(data.initiatorSignal, undefined, data.remoteUUID);
                let webPeer = webPeerSignalingClientListObject.webPeer;

                if (webPeer.peer === null) { //arrived earlier than  /receive-initiator-signal
                    webPeer.createPeer(false, socket, data.id, (iceCandidate) => {this.sendAnswerIceCandidate(socket, data.id, iceCandidate) }, data.remoteAddress, data.remoteUUID, socket.level+1);
                    webPeer.peer.signalInitiatorData = data.initiatorSignal;
                }


                let answer = await webPeer.createSignal(data.iceCandidate);

                if (!answer.result )
                    throw {message: answer.message};

                socket.node.sendRequest("signals/client/answer/receive-ice-candidate/" + data.id, { accepted: true, answerSignal: answer.signal} );

            } catch (exception){
                console.error("signals/client/answer/receive-ice-candidate/"+ data.id, exception);
                socket.node.sendRequest("signals/client/answer/receive-ice-candidate/" + data.id, {accepted:false, answerSignal: undefined, message: exception.message });
            }

        });

    }

    initializeSignalingClientService(socket) {

        this._initializeSimpleProtocol(socket);

        this._initializeSignalingClientService1(socket);
        this._initializeSignalingClientService2(socket);

        NodeSignalingClientSerivce.subscribeSignalingServer(socket);
    }



    sendInitiatorIceCandidate(socket, connectionId, iceCandidate){
        //console.warn("sendInitiatorIceCandidate", connectionId, iceCandidate);
        socket.node.sendRequest("signals/server/new-initiator-ice-candidate/" + connectionId, {candidate: iceCandidate} )
    }

    sendAnswerIceCandidate(socket, connectionId, iceCandidate){
        //console.warn("sendAnswerIceCandidate", connectionId, iceCandidate);
        socket.node.sendRequest("signals/server/new-answer-ice-candidate/" + connectionId, {candidate: iceCandidate} )
    }

    webPeerDisconnected(webPeer){

        webPeer.peer.signaling.socketSignaling.node.sendRequest("signals/server/connections/established-connection-was-dropped", {address: webPeer.remoteAddress, connectionId: webPeer.peer.signaling.connectionId} );
        SignalingClientList.desinitializeWebPeerConnection(webPeer);

    }

    sendSuccessConnection(webPeer){
        webPeer.peer.signaling.socketSignaling.node.sendRequest("signals/server/connections/was-established-successfully", {connectionId: webPeer.peer.signaling.connectionId})
    }

    sendErrorConnection(webPeer){
        webPeer.peer.signaling.socketSignaling.node.sendRequest("signals/server/connections/error-establishing-connection", {connectionId: webPeer.peer.signaling.connectionId})
    }

}

export default new NodeSignalingClientProtocol();