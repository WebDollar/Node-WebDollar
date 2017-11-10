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

            webPeer.createPeer(true);

            await webPeer.createSignalInitiator( (iceCandidate)=>{ socket.node.sendRequest("signals/server/new-initiator-ice-candidate/" + data.id, {candidate: iceCandidate} ) });

            let signal = webPeer.peer.signalData;

            console.log("###################### signals/client/initiator/generate-initiator-signal/"+data.id, signal, typeof signal);

            socket.node.sendRequest("signals/client/initiator/generate-initiator-signal/" + data.id, {
                accepted: true,
                initiatorSignal: signal,
            });

        });


        socket.on("signals/client/answer/receive-initiator-signal", async (data) => {

            let addressToConnect = data.address;

            let webPeerSignalingClientListObject = SignalingClientList.registerWebPeerSignalingClientListBySignal(undefined);
            let webPeer = webPeerSignalingClientListObject.webPeer;

            webPeer.createPeer(false);

            await webPeer.createSignal(data.initiatorSignal);
            let signal = webPeer.peer.signalData;

            console.log("################# signals/client/answer/receive-initiator-signal",  signal, data.id);

            socket.node.sendRequest("signals/client/answer/receive-initiator-signal/" + data.id, {
                accepted: true,
                answerSignal: signal
            });

        });

        socket.on("signals/client/answer/receive-ice-candidate", async (data) => {

            let addressToConnect = data.address;

            let webPeerSignalingClientListObject = SignalingClientList.registerWebPeerSignalingClientListBySignal(undefined);
            let webPeer = webPeerSignalingClientListObject.webPeer;

            webPeer.createPeer(false);

            await webPeer.createSignal(data.iceCandidate);
            let signal = webPeer.peer.signalData;

            console.log("################# signals/client/answer/receive-ice-candidate/",  signal, data.id);

            socket.node.sendRequest("signals/client/answer/receive-ice-candidate/" + data.id, {
                accepted: true,
                answerSignal: signal
            });

        });


        socket.on("signals/client/initiator/join-answer-signal", async (data) => {

            let addressToConnect = data.address;

            let webPeerSignalingClientListObject = SignalingClientList.registerWebPeerSignalingClientListBySignal(data.initiatorSignal);
            let webPeer = webPeerSignalingClientListObject.webPeer;

            console.log("################# signals/client/join-answer-signal",  webPeer, data.initiatorSignal, data.answerSignal);

            let timeoutId = setTimeout(() => {
                socket.sendRequest("signals/client/join-answer-signal/" + data.id, {established: false,});
            }, 30000);

            webPeer.peer.once("connect", () => {

                console.log("%%%%%%%%%%%% connection established");
                clearTimeout(timeoutId);

                socket.node.sendRequest("signals/client/join-answer-signal/" + data.id, {established: true,});
            });

            webPeer.peer.once("error", ()=>{

                console.log("%%%%%%% connection NOT established");
                clearTimeout(timeoutId);

                socket.node.sendRequest("signals/client/join-answer-signal/" + data.id, {established: false,});
            });

            await webPeer.createSignal(data.answerSignal);

        });

        this.subscribeClientToSignalingServer(socket, params);
    }

    subscribeClientToSignalingServer(socket, params){

        socket.node.sendRequest("signals/server/register/accept-web-peer-connections", {params: params} );

    }



}

exports.NodeSignalingClientProtocol = new NodeSignalingClientProtocol();
