const colors = require('colors/safe');
import consts from 'consts/const_global'

import SignalingClientList from './signaling-client-list/signaling-client-list'
import NodesList from 'node/lists/nodes-list'

class NodeSignalingClientProtocol {

    constructor(){
        console.log("NodeSignalingClientProtocol constructor");
    }

    /*
        Signaling Server Service
     */

    initializeSignalingClientService(socket, params) {

        socket.node.on("signals/client/initiator/generate-initiator-signal", async (data) => {

            if (data.remoteUUID === undefined || data.remoteUUID === null){
                console.error("data.remoteUUID 1", data.remoteUUID);
                return false;
            }

            //search if the new protocol was already connected in the past
            if (NodesList.searchNodeSocketByAddress(data.remoteUUID, 'all', ["uuid"] ) !== null) //already connected in the past
                return socket.node.sendRequest("signals/client/initiator/generate-initiator-signal/" + data.id, {accepted:false, message: "Already connected"});

            console.log("data.remoteUUID 1", data.remoteUUID);

            let webPeerSignalingClientListObject = SignalingClientList.registerWebPeerSignalingClientListBySignal(undefined);
            let webPeer = webPeerSignalingClientListObject.webPeer;

            webPeer.createPeer(true, socket, data.id, (iceCandidate) => {this.sendInitiatorIceCandidate(socket, data.id, iceCandidate) }, data.remoteAddress, data.remoteUUID, socket.level+1);

            let answer = await webPeer.createSignalInitiator();

            console.log("###################### signals/client/initiator/generate-initiator-signal/"+data.id, answer, webPeer.peer, typeof answer);

            if (answer.signal === undefined)
                console.log("WEBRTC 1 is not supported !!!! being the initiator");

            let signalAnswer = {};
            if (answer.result === true)
                signalAnswer = {accepted: true, initiatorSignal: answer.signal};
            else
                signalAnswer = {accepted:false, message: answer.message};

            socket.node.sendRequest("signals/client/initiator/generate-initiator-signal/" + data.id, signalAnswer);

        });


        socket.node.on("signals/client/answer/receive-initiator-signal", async (data) => {

            if (data.remoteUUID === undefined || data.remoteUUID === null){
                console.error("data.remoteUUID 2", data.remoteUUID);
                return false;
            }

            //search if the new protocol was already connected in the past
            if (NodesList.searchNodeSocketByAddress(data.remoteUUID, 'all', ["uuid"] ) !== null) //already connected in the past
                return socket.node.sendRequest("signals/client/answer/receive-initiator-signal/" + data.id, {accepted:false, message: "Already connected"});

            console.log("data.remoteUUID 2", data.remoteUUID);

            let webPeerSignalingClientListObject = SignalingClientList.registerWebPeerSignalingClientListBySignal(data.initiatorSignal);
            let webPeer = webPeerSignalingClientListObject.webPeer;

            if (webPeer.peer === null) { //arrived earlier than  /receive-initiator-signal
                webPeer.createPeer(false, socket, data.id, (iceCandidate) => {this.sendAnswerIceCandidate(socket, data.id, iceCandidate) },  data.remoteAddress, data.remoteUUID, socket.level+1);
                webPeer.peer.signalInitiatorData = data.initiatorSignal;
            }

            console.log("receive-initiator-signal", data);

            let answer = await webPeer.createSignal(data.initiatorSignal);
            console.log("################# signals/client/answer/receive-initiator-signal",  answer, data.id);

            if (answer.signal === undefined)
                console.log("WEBRTC 2 is not supported !!!!", data.initiatorSignal);

            let signalAnswer = {};
            if (answer.result === true)
                signalAnswer = {accepted: true, answerSignal: answer.signal};
            else
                signalAnswer = {accepted:false, message: answer.message};


            socket.node.sendRequest("signals/client/answer/receive-initiator-signal/" + data.id, signalAnswer);

        });

        socket.node.on("signals/client/answer/receive-ice-candidate", async (data) => {

            if (data.remoteUUID === undefined || data.remoteUUID === null){
                console.error("data.remoteUUID 3", data.remoteUUID);
                return false;
            }

            //search if the new protocol was already connected in the past
            if (NodesList.searchNodeSocketByAddress(data.remoteUUID, 'all', ["uuid"] ) !== null) //already connected in the past
                return socket.node.sendRequest("signals/client/answer/receive-ice-candidate/" + data.id, {established:false, message: "Already connected"});

            console.log("data.remoteUUID 3", data.remoteUUID);

            let webPeerSignalingClientListObject = SignalingClientList.searchWebPeerSignalingClientList(data.initiatorSignal);

            let webPeer = webPeerSignalingClientListObject.webPeer;

            if (webPeer.peer === null) { //arrived earlier than  /receive-initiator-signal
                webPeer.createPeer(false, socket, data.id, (iceCandidate) => {this.sendAnswerIceCandidate(socket, data.id, iceCandidate) }, data.remoteAddress, data.remoteUUID, socket.level+1);
                webPeer.peer.signalInitiatorData = data.initiatorSignal;
            }

            console.log("ice candidate", data);

            let answer = await webPeer.createSignal(data.iceCandidate);
            console.log("################# signals/client/answer/receive-ice-candidate",  data.iceCandidate, answer, data.id);

            if (answer.signal === undefined)
                console.log("WEBRTC 3 is not supported !!!!", data.iceCandidate);

            let signalAnswer = {};
            if (answer.result === true)
                signalAnswer = {accepted: true, answerSignal: answer.signal};
            else
                signalAnswer = {accepted:false, message: answer.message}


            socket.node.sendRequest("signals/client/answer/receive-ice-candidate/" + data.id, signalAnswer);

        });

        socket.node.on("signals/client/initiator/receive-ice-candidate", async (data) => {

            if (data.remoteUUID === undefined || data.remoteUUID === null){
                console.error("data.remoteUUID 4", data.remoteUUID);
                return false;
            }

            if (data.iceCandidate === undefined){
                console.error("data.iceCandidate 4", data.answerSignal);
                return false;
            }

            //search if the new protocol was already connected in the past
            if (NodesList.searchNodeSocketByAddress(data.remoteUUID, 'all', ["uuid"] ) !== null) //already connected in the past
                return socket.node.sendRequest("signals/client/initiator/receive-ice-candidate/" + data.id, {established:false, message: "Already connected"});

            console.log("data.remoteUUID 4", data.remoteUUID);

            let webPeerSignalingClientListObject = SignalingClientList.searchWebPeerSignalingClientList(data.initiatorSignal);
            let webPeer = webPeerSignalingClientListObject.webPeer;

            //arrived earlier than  /receive-initiator-signal
            if (webPeer.peer === null){
                webPeer.createPeer(false, socket, data.id, (iceCandidate) => {this.sendInitiatorIceCandidate(socket, data.id, iceCandidate) }, data.remoteAddress, data.remoteUUID, socket.level+1 );
                webPeer.peer.signalInitiatorData = data.initiatorSignal;
            }

            console.log("ice candidate", data);

            let answer = await webPeer.createSignal(data.iceCandidate);

            let signalAnswer = {};
            if (answer.result === true)
                signalAnswer = {accepted: true, answerSignal: answer.signal};
            else
                signalAnswer = {accepted:false, message: answer.message};

            console.log("################# signals/client/initiator/receive-ice-candidate/",  data.iceCandidate, signalAnswer, data.id);

            socket.node.sendRequest("signals/client/initiator/receive-ice-candidate/" + data.id, signalAnswer);

        });


        socket.node.on("signals/client/initiator/join-answer-signal", async (data) => {

            if (data.remoteUUID === undefined || data.remoteUUID === null){
                console.error("data.remoteUUID 5", data.remoteUUID);
                return false;
            }

            //search if the new protocol was already connected in the past
            if (NodesList.searchNodeSocketByAddress(data.remoteUUID, 'all', ["uuid"] ) !== null) //already connected in the past
                return socket.node.sendRequest("signals/client/initiator/join-answer-signal/" + data.id, {established:false, message: "Already connected"});

            console.log("data.remoteUUID 5", data.remoteUUID);

            console.log("join-answer-signal", SignalingClientList.list.length, data.initiatorSignal);

            let webPeerSignalingClientListObject = SignalingClientList.searchWebPeerSignalingClientList(data.initiatorSignal);
            let webPeer = webPeerSignalingClientListObject.webPeer;

            console.log("################# signals/client/initiator/join-answer-signal",  webPeer, data.initiatorSignal, data.answerSignal);

            let timeoutId = setTimeout( () => {
                console.log("%%%%%%%%%%%% WEBRTC TIMEOUT !!!!");
                socket.node.sendRequest("signals/client/initiator/join-answer-signal/" + data.id, {established: false,});
            }, 30000);

            let connectId = webPeer.peer.once("connect", () => {

                console.log("%%%%%%%%%%%% WEBRTC connection established");
                clearTimeout(timeoutId);

                socket.node.sendRequest("signals/client/initiator/join-answer-signal/" + data.id, {established: true,});
            });

            let disconnectId = webPeer.peer.once("error", ()=>{

                console.log("%%%%%%% WEBRTC connection NOT established");
                clearTimeout(timeoutId);

                socket.node.sendRequest("signals/client/initiator/join-answer-signal/" + data.id, {established: false,});
            });

            console.log("#$$$$$$$$$$ ANSWER ", webPeer, data);
            let answer = await webPeer.joinAnswer(data.answerSignal);

        });

        this.subscribeClientToSignalingServer(socket, params);
    }

    subscribeClientToSignalingServer(socket, params){

        if (socket.node.type === "client" || socket.node.type === "webpeer")
            socket.node.sendRequest("signals/server/register/accept-web-peer-connections", {params: params} );

    }


    sendInitiatorIceCandidate(socket, connectionId, iceCandidate){
        //console.log("sendInitiatorIceCandidate", connectionId, iceCandidate);
        socket.node.sendRequest("signals/server/new-initiator-ice-candidate/" + connectionId, {candidate: iceCandidate} )
    }

    sendAnswerIceCandidate(socket, connectionId, iceCandidate){
        //console.log("sendAnswerIceCandidate", connectionId, iceCandidate);
        socket.node.sendRequest("signals/server/new-answer-ice-candidate/" + connectionId, {candidate: iceCandidate} )
    }

}

export default new NodeSignalingClientProtocol();
