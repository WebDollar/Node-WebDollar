import {nodeProtocol, nodeFallBackInterval} from '../../../../../consts/const_global.js';

import {SignalingClientList} from './signaling-client-list/signaling-client-list'

class NodeSignalingClientProtocol {

    constructor(){
        console.log("NodeSignalingClientProtocol constructor");
    }

    /*
        Signaling Server Service
     */

    initializeSignalingClientService(socket, params) {

        socket.on("signals/client/initiator/generate-initiator-signal", async (data) => {

            let addressToConnect = data.address;

            let webPeerSignalingClientListObject = SignalingClientList.registerWebPeerSignalingClientListBySignal(undefined);
            let webPeer = webPeerSignalingClientListObject.webPeer;

            console.log("###################### signals/client/initiator/generate-initiator-signal"+data.id, webPeer.peer);

            webPeer.createPeer(true, (iceCandidate) => {this.sendInitiatorIceCandidate(socket, data.id, iceCandidate) });

            let answer = await webPeer.createSignalInitiator();

            console.log("###################### signals/client/initiator/generate-initiator-signal/"+data.id, answer, typeof answer);

            let signalAnswer = {};
            if (answer.result === true) signalAnswer = {accepted: true, initiatorSignal: answer.signal};
            else signalAnswer = {accepted:false, message: answer.message};

            socket.node.sendRequest("signals/client/initiator/generate-initiator-signal/" + data.id, signalAnswer);

        });


        socket.on("signals/client/answer/receive-initiator-signal", async (data) => {

            let webPeerSignalingClientListObject = SignalingClientList.registerWebPeerSignalingClientListBySignal(data.initiatorSignal);
            let webPeer = webPeerSignalingClientListObject.webPeer;

            if (webPeer.peer === null) { //arrived earlier than  /receive-initiator-signal
                webPeer.createPeer(false,  (iceCandidate) => {this.sendAnswerIceCandidate(socket, data.id, iceCandidate) });
                webPeer.peer.signalInitiatorData = data.initiatorSignal;
            }

            console.log("ice candidate", data);

            let answer = await webPeer.createSignal(data.initiatorSignal);
            console.log("################# signals/client/answer/receive-initiator-signal",  answer, data.id);

            let signalAnswer = {};
            if (answer.result === true) signalAnswer = {accepted: true, answerSignal: answer.signal};
            else signalAnswer = {accepted:false, message: answer.message}


            socket.node.sendRequest("signals/client/answer/receive-initiator-signal/" + data.id, signalAnswer);

        });

        socket.on("signals/client/answer/receive-ice-candidate", async (data) => {

            let webPeerSignalingClientListObject = SignalingClientList.registerWebPeerSignalingClientListBySignal(data.initiatorSignal);
            let webPeer = webPeerSignalingClientListObject.webPeer;

            if (webPeer.peer === null) { //arrived earlier than  /receive-initiator-signal
                webPeer.createPeer(false,  (iceCandidate) => {this.sendAnswerIceCandidate(socket, data.id, iceCandidate) });
                webPeer.peer.signalInitiatorData = data.initiatorSignal;
            }

            console.log("ice candidate", data);

            let answer = await webPeer.createSignal(data.iceCandidate);
            console.log("################# signals/client/answer/receive-ice-candidate",  data.iceCandidate, answer, data.id);

            let signalAnswer = {};
            if (answer.result === true) signalAnswer = {accepted: true, answerSignal: answer.signal};
            else signalAnswer = {accepted:false, message: answer.message}


            socket.node.sendRequest("signals/client/answer/receive-ice-candidate/" + data.id, signalAnswer);

        });

        socket.on("signals/client/initiator/receive-ice-candidate", async (data) => {

            let addressToConnect = data.address;

            let webPeerSignalingClientListObject = SignalingClientList.registerWebPeerSignalingClientListBySignal(data.initiatorSignal);
            let webPeer = webPeerSignalingClientListObject.webPeer;

            //arrived earlier than  /receive-initiator-signal
            if (webPeer.peer === null){
                webPeer.createPeer(false, (iceCandidate) => {this.sendInitiatorIceCandidate(socket, data.id, iceCandidate) });
                webPeer.peer.signalInitiatorData = data.initiatorSignal;
            }

            console.log("ice candidate", data);

            let answer = await webPeer.createSignal(data.iceCandidate);

            let signalAnswer = {};
            if (answer.result === true) signalAnswer = {accepted: true, answerSignal: answer.signal};
            else signalAnswer = {accepted:false, message: answer.message};

            console.log("################# signals/client/initiator/receive-ice-candidate/",  data.iceCandidate, signalAnswer, data.id);

            socket.node.sendRequest("signals/client/initiator/receive-ice-candidate/" + data.id, signalAnswer);

        });


        socket.on("signals/client/initiator/join-answer-signal", async (data) => {

            let addressToConnect = data.address;

            console.log("join-answer-signal");
            console.log(SignalingClientList.list);
            console.log(data.initiatorSignal);

            let webPeerSignalingClientListObject = SignalingClientList.registerWebPeerSignalingClientListBySignal(data.initiatorSignal);
            let webPeer = webPeerSignalingClientListObject.webPeer;

            console.log("################# signals/client/initiator/join-answer-signal",  webPeer, data.initiatorSignal, data.answerSignal);

            let timeoutId = setTimeout(() => {
                socket.sendRequest("signals/client/initiator/join-answer-signal" + data.id, {established: false,});
            }, 30000);

            let connectId = webPeer.peer.once("connect", () => {

                console.log("%%%%%%%%%%%% WEBRTC connection established");
                clearTimeout(timeoutId);

                socket.node.sendRequest("signals/client/initiator/join-answer-signal" + data.id, {established: true,});
            });

            let disconnectId = webPeer.peer.once("error", ()=>{

                console.log("%%%%%%% WEBRTC connection NOT established");
                clearTimeout(timeoutId);

                socket.node.sendRequest("signals/client/initiator/join-answer-signal" + data.id, {established: false,});
            });

            console.log("#$$$$$$$$$$ ANSWER ", webPeer, data.answerSignal);
            let answer = await webPeer.createSignal(data.answerSignal);

        });

        this.subscribeClientToSignalingServer(socket, params);
    }

    subscribeClientToSignalingServer(socket, params){

        if (socket.node.type === "client" || socket.node.type === "webpeer")
            socket.node.sendRequest("signals/server/register/accept-web-peer-connections", {params: params} );

    }


    sendInitiatorIceCandidate(socket, connectionId, iceCandidate){
        console.log("sendInitiatorIceCandidate", connectionId, iceCandidate);
        socket.node.sendRequest("signals/server/new-initiator-ice-candidate/" + connectionId, {candidate: iceCandidate} )
    }

    sendAnswerIceCandidate(socket, connectionId, iceCandidate){
        console.log("sendAnswerIceCandidate", connectionId, iceCandidate);
        socket.node.sendRequest("signals/server/new-answer-ice-candidate/" + connectionId, {candidate: iceCandidate} )
    }

}

exports.NodeSignalingClientProtocol = new NodeSignalingClientProtocol();
