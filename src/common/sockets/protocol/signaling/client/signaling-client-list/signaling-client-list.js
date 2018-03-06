import SignalingClientPeerObject from './signaling-client-peer-object';

//import NodeWebPeer from "node/webrtc/web-peer/node-web-peer";
import NodeWebPeerRTC from "node/webrtc/web-peer/node-web-peer-webRTC";

/*
    The List is populated with Node Sockets who are available for WebRTC
 */

class SignalingClientList {

    // list = []            - storing the connected sockets

    constructor(){

        console.log("SignalingRoomList constructor");

        this.list = [];
        this.events = [];
    }

    registerWebPeerSignalingClientListBySignal(signalInitiator, signalAnswer, uuid) {

        let signalingClientPeerObject = this.searchWebPeerSignalingClientList(signalInitiator, signalAnswer, uuid);

        if (signalingClientPeerObject === null){

            let webPeer = new NodeWebPeerRTC();
            signalingClientPeerObject = new SignalingClientPeerObject(webPeer, uuid);

            this.list.push(signalingClientPeerObject);

        }

        return signalingClientPeerObject;
    }

    searchWebPeerSignalingClientList(signalInitiator, signalAnswer, uuid){

        //previous established connection
        for (let i = 0; i < this.list.length; i++)
            if (this.list[i].webPeer.peer !== null && this.list[i].webPeer.peer !== undefined ) {

            //console.log("searchWebPeerSignalingClientList", this.list[i].webPeer.peer.signalData, data, JSON.stringify(this.list[i].webPeer.peer.signalData) === JSON.stringify(data));

            if ( signalInitiator !== undefined && JSON.stringify(this.list[i].webPeer.peer.signalInitiatorData) === JSON.stringify(signalInitiator))
                return this.list[i];

            if ( signalAnswer !== undefined && JSON.stringify(this.list[i].webPeer.peer.signalData) === JSON.stringify(signalAnswer))
                return this.list[i];

            if ( uuid !== undefined && this.list[i].uuid === uuid)
                return this.list[i];

        }


        return null;
    }


}

export default new SignalingClientList();