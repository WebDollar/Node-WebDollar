import consts from 'consts/const_global'

import SignalingClientList from './signaling-client-list/signaling-client-list'
import NodesList from 'node/lists/Nodes-List'
import NodeSignalingClientSerivce from "./signaling-client-service/Node-Signaling-Client-Service"

class NodeSignalingClientProtocol {

    constructor(){

        console.log("NodeSignalingClientProtocol constructor");
    }

    _initializeSimpleProtocol(socket){


    }

    /*
        Signaling Server Service
     */

    //initiator
    _initializeSignalingClientService1(socket){

        //TODO protocol to request to connect me with somebody

        socket.node.on("signals/client/initiator/generate-initiator-signal", async (data) => {

            try{

                if ( data.remoteUUID === undefined || data.remoteUUID === null)
                    throw {message: "remoteUUID was not specified"};

                //search if the new protocol was already connected in the past
                if ( NodesList.searchNodeSocketByAddress(data.remoteUUID, 'all', ["uuid"] ) !== null) //already connected in the past
                    throw {message: "Already connected"};

                if ( SignalingClientList.searchWebPeerSignalingClientList(undefined, undefined, data.remoteUUID) !== null)
                    throw {message: "Already connected"};

                if ( SignalingClientList.countConnectedByType("initiator") > SignalingClientList.computeMaxWebPeersConnected( data.remoteUUID ) )
                    throw {message: "I can't accept WebPeers anymore" };

                if (consts.DEBUG) console.warn("WEBRTC# 1 Generate Initiator Signal");

                let webPeerSignalingClientListObject = SignalingClientList.registerWebPeerSignalingClientListBySignal(undefined, undefined, data.remoteUUID, "initiator");
                let webPeer = webPeerSignalingClientListObject.webPeer;

                if (webPeer.peer === null)
                    webPeer.createPeer(true, socket, data.connectionId, (iceCandidate) => { this.sendInitiatorIceCandidate(socket, data.connectionId, iceCandidate) }, data.remoteAddress, data.remoteUUID, socket.level+1);


                let answer = await webPeer.createSignalInitiator();

                if (consts.DEBUG)
                    console.log("###################### signals/client/initiator/generate-initiator-signal/answer" + data.connectionId, answer, webPeer.peer, typeof answer);

                if (answer.signal === undefined)
                    console.error("WEBRTC 1 is not supported !!!! being the initiator");

                if (!answer.result )
                    throw {message: "Failed to Get a initiatorSignal: " +answer.message};

                socket.node.sendRequest("signals/client/initiator/generate-initiator-signal/answer", {connectionId: data.connectionId, accepted: true, initiatorSignal: answer.signal});

            } catch (exception){

                if (exception.message !== "Already connected" && exception.message !== "I can't accept WebPeers anymore")
                    console.error("signals/client/initiator/generate-initiator-signal/answer", exception);

                socket.node.sendRequest("signals/client/initiator/generate-initiator-signal/answer", {connectionId: data.connectionId, accepted:false, initiatorSignal: undefined, message: exception.message });
            }

        });

        socket.node.on("signals/client/initiator/join-answer-signal", async (data) => {

            try {

                if (consts.DEBUG) console.warn("WEBRTC# 1_2");

                if (data.remoteUUID === undefined || data.remoteUUID === null) throw { message: "remoteUUID was not specified" };

                let webPeerSignalingClientListObject = SignalingClientList.searchWebPeerSignalingClientList(data.initiatorSignal, undefined, data.remoteUUID);

                if (webPeerSignalingClientListObject === null) throw { message: "WebRTC Client was not found"};

                let answer = await webPeerSignalingClientListObject.webPeer.joinAnswer(data.answerSignal);

                if (!answer.result)
                    throw {message: answer.message};

                socket.node.sendRequest("signals/client/initiator/join-answer-signal/answer", {connectionId: data.connectionId, established: true, remoteUUID: data.remoteUUID });

            } catch (exception){

                if (exception.message !== "Already connected" && exception.message !== "I can't accept WebPeers anymore")
                    console.error("signals/client/initiator/join-answer-signal",  data.connectionId, exception);

                socket.node.sendRequest("signals/client/initiator/join-answer-signal/answer", {connectionId: data.connectionId, established: false, message: exception.message });
            }

        });

        socket.node.on("signals/client/initiator/receive-ice-candidate", async (data) => {

            try {

                if (consts.DEBUG) console.warn("WEBRTC# 1_3");

                if (data.remoteUUID === undefined || data.remoteUUID === null)
                    throw {message: "data.remoteUUID 4 was not specified"};

                if (data.iceCandidate === undefined)
                    throw {message: "data.iceCandidate 4 was not specified"};

                let webPeerSignalingClientListObject = SignalingClientList.searchWebPeerSignalingClientList(data.initiatorSignal, undefined, data.remoteUUID);

                if ( webPeerSignalingClientListObject === null ) throw { message: "WebRTC Client was not found"};

                let answer = await webPeerSignalingClientListObject.webPeer.createSignal(data.iceCandidate);

                if (!answer.result )
                    throw {message: answer.message};

                socket.node.sendRequest("signals/client/initiator/receive-ice-candidate"+"/answer", { connectionId: data.connectionId, accepted: true, answerSignal: answer.signal} );

            } catch (exception){

                if (exception.message !== "Already connected" && exception.message !== "I can't accept WebPeers anymore")
                    console.error("signals/client/initiator/receive-ice-candidate/" + data.connectionId, exception);

                socket.node.sendRequest("signals/client/initiator/receive-ice-candidate"+"/answer", { connectionId: data.connectionId, accepted: false,  message: exception.message });
            }

        });

    }

    _searchWebPeerSignalingClientList2(socket, data ){

        let webPeerSignalingClientListObject = SignalingClientList.searchWebPeerSignalingClientList(undefined, data.remoteUUID);

        if (webPeerSignalingClientListObject === null) {

            if ( SignalingClientList.countConnectedByType("answer") > SignalingClientList.computeMaxWebPeersConnected( data.remoteUUID ))
                throw {message: "I can't accept WebPeers anymore" };

            webPeerSignalingClientListObject = SignalingClientList.registerWebPeerSignalingClientListBySignal(undefined, undefined, data.remoteUUID, "answer");
        }

        let webPeer = webPeerSignalingClientListObject.webPeer;

        if ( webPeer.peer === null ) { //arrived earlier than  /receive-initiator-signal

            webPeer.createPeer(false, socket, data.connectionId, (iceCandidate) => {this.sendAnswerIceCandidate(socket, data.connectionId, iceCandidate)}, data.remoteAddress, data.remoteUUID, socket.level + 1);
            webPeer.peer.signalInitiatorData = data.initiatorSignal;

        }


        return webPeer;
    }

    //answer
    _initializeSignalingClientService2(socket){

        socket.node.on("signals/client/answer/receive-initiator-signal", async (data) => {

            try {

                if (consts.DEBUG) console.warn("WEBRTC# 2");

                if (data.remoteUUID === undefined || data.remoteUUID === null)
                    throw {message: "data.remoteUUID 2 was not specified"}

                //search if the new protocol was already connected in the past
                if (NodesList.searchNodeSocketByAddress(data.remoteUUID, 'all', ["uuid"]) !== null) //already connected in the past
                    throw {message: "Already connected"};

                if (SignalingClientList.searchWebPeerSignalingClientList(data.initiatorSignal, undefined, data.remoteUUID) !== null)
                    throw {message: "Already connected"};

                let webPeer = this._searchWebPeerSignalingClientList2(socket, data);

                let answer = await webPeer.createSignal(data.initiatorSignal);

                if (answer.signal === undefined)
                    console.log("WEBRTC 2 is not supported !!!!", answer);

                if (!answer.result )
                    throw {message: answer.message };

                socket.node.sendRequest("signals/client/answer/receive-initiator-signal/answer" , {connectionId: data.connectionId , accepted: true, answerSignal: answer.signal} );

            } catch (exception){

                if (exception.message !== "Already connected" && exception.message !== "I can't accept WebPeers anymore")
                    console.error("signals/client/answer/receive-initiator-signal/answer", exception);

                socket.node.sendRequest("signals/client/answer/receive-initiator-signal/answer", {connectionId:data.connectionId, accepted:false, answerSignal: undefined });
            }

        });

        socket.node.on("signals/client/answer/receive-ice-candidate", async (data) => {

            try{

                if (consts.DEBUG) console.warn("WEBRTC# 2_2");

                if (data.remoteUUID === undefined || data.remoteUUID === null)
                    throw {message: "data.remoteUUID 3 is empty"};

                let webPeer = this._searchWebPeerSignalingClientList2(socket, data);

                let answer = await webPeer.createSignal(data.iceCandidate);

                if (!answer.result )
                    throw {message: answer.message};

                socket.node.sendRequest("signals/client/answer/receive-ice-candidate"+"/answer", { connectionId: data.connectionId, accepted: true, answerSignal: answer.signal} );

            } catch (exception){

                if (exception.message !== "Already connected" && exception.message !== "I can't accept WebPeers anymore")
                    console.error("signals/client/answer/receive-ice-candidate"+"/answer", data.connectionId, exception);

                socket.node.sendRequest("signals/client/answer/receive-ice-candidate"+"/answer", {connectionId: data.connectionId, accepted:false, answerSignal: undefined, message: exception.message });
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
        socket.node.sendRequest("signals/server/new-initiator-ice-candidate", {connectionId: connectionId, candidate: iceCandidate} )
    }

    sendAnswerIceCandidate(socket, connectionId, iceCandidate){
        //console.warn("sendAnswerIceCandidate", connectionId, iceCandidate);
        socket.node.sendRequest("signals/server/new-answer-ice-candidate", {connectionId: connectionId, candidate: iceCandidate} )
    }

    webPeerDisconnected(webPeer){

        webPeer.peer.signaling.socketSignaling.node.sendRequest("signals/server/connections/established-connection-was-dropped", {connectionId: webPeer.peer.signaling.connectionId, address: webPeer.remoteAddress} );
        SignalingClientList.desinitializeWebPeerConnection(webPeer);

    }

    sendSuccessConnection(webPeer){
        if (webPeer.peer !== null && webPeer.peer.signaling !== null)
            webPeer.peer.signaling.socketSignaling.node.sendRequest("signals/server/connections/was-established-successfully", {connectionId: webPeer.peer.signaling.connectionId})
    }

    sendErrorConnection(webPeer){
        if (webPeer.peer !== null && webPeer.peer.signaling !== null)
            webPeer.peer.signaling.socketSignaling.node.sendRequest("signals/server/connections/error-establishing-connection", {connectionId: webPeer.peer.signaling.connectionId})
    }

}

export default new NodeSignalingClientProtocol();