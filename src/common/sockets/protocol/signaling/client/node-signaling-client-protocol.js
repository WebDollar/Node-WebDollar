import {nodeProtocol, nodeFallBackInterval} from '../../../../../consts/const_global.js';

import {SignalingClientList} from './signaling-client-list/signaling-client-list'
import {NodeWebPeer} from './../../../../../node/webrtc/web_peer/node-web-peer'

class NodeSignalingClientProtocol {

    constructor(){
        console.log("NodeSignalingClientProtocol constructor");
    }

    /*
        Signaling Server Service
     */

    initializeSignalingClientService(socket){


        socket.on("signals/client/generate-initiator-signal", async (data) => {

            let addressToConnect = data.address;

            let webPeerSignalingClientListObject =  SignalingClientList.registerWebPeerSignalingClientListBySignal(undefined, true);

            let webPeer = webPeerSignalingClientListObject.webPeer;
            await webPeer.peer.signal;

            webPeer.sendRequest("signals/client/generate-initiator-signal/"+data.id, {
                accepted:true,
                initiatorSignal: JSON.stringify( webPeer.peer.signal )
            });

        });

        socket.on("signals/client/generate-answer-signal", async (data) =>{

            let addressToConnect = data.address;

            let webPeerSignalingClientListObject = SignalingClientList.registerWebPeerSignalingClientListBySignal(undefined, false);

            let webPeer = webPeerSignalingClientListObject.webPeer;
            await webPeer.createSignal( data.initiatorSignal );

            webPeer.sendRequest("signals/client/generate-answer-signal/"+data.id, {
                accepted:true,
                answerSignal: JSON.stringify( webPeer.peer.signal )
            });

        });

        socket.on("signals/client/join-answer-signal", async  (data) =>{

            let addressToConnect = data.address;

            let webPeerSignalingClientListObject = SignalingClientList.registerWebPeerSignalingClientListBySignal(data.initiatorSignal, false);
            let webPeer = webPeerSignalingClientListObject.webPeer;

            await webPeer.createSignal( data.answerSignal );

            let timeoutId = setTimeout(()=>{
                socket.sendRequest("signals/client/join-answer-signal/"+data.id, { established: false, });
            }, 5000);

            webPeer.peer.once("connect", ()=>{

                clearTimeout(timeoutId);

                socket.sendRequest("signals/client/join-answer-signal/"+data.id, { established:true, });
            })


        });

    }



    registerSignal(signal){

        node.protocol.broadcastMessageAllSockets("node_propagation", {instruction: "new-address", addresses: addresses });

    }



}

exports.NodeSignalingClientProtocol = new NodeSignalingClientProtocol();
