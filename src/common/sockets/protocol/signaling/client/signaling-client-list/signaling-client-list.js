import {SignalingClientPeerObject} from './signaling-client-peer-object';

//import {NodeWebPeer} from "../../../../../../node/webrtc/web_peer/node-web-peer";
import {NodeWebPeerRTC} from "../../../../../../node/webrtc/web_peer/node-web-peer-webRTC";

const colors = require('colors/safe');

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

    registerWebPeerSignalingClientListBySignal(signalToSearch) {

        let signalingClientPeerObject = null;

        if (typeof signalToSearch === 'undefined') signalingClientPeerObject = null;
        else signalingClientPeerObject = this.searchWebPeerSignalingClientList(signalToSearch);

        if (signalingClientPeerObject === null){

            let webPeer = new NodeWebPeerRTC();
            signalingClientPeerObject = new SignalingClientPeerObject(webPeer);

            this.list.push(signalingClientPeerObject);
        }

        return signalingClientPeerObject;
    }

    searchWebPeerSignalingClientList(data){

        if (data === null) return null;

        //previous established connection
        for (let i = 0; i < this.list.length; i++) {
            //console.log("searchWebPeerSignalingClientList", this.list[i].webPeer.peer.signalData, data, JSON.stringify(this.list[i].webPeer.peer.signalData) === JSON.stringify(data));
            if (this.list[i].webPeer === data || (this.list[i].webPeer.peer !== null && (JSON.stringify(this.list[i].webPeer.peer.signalData) === JSON.stringify(data)) || (JSON.stringify(this.list[i].webPeer.peer.signalInitiatorData) === JSON.stringify(data)))) {
                return this.list[i];
            }
        }


        return null;
    }


    /*
        EVENTS - Callbacks
     */

    registerEvent(eventName, params, callback){

        this.events.push({
            name: eventName,
            params: params,
            callback: callback,
        })
    }

    getEvents(eventName){

        let list = [];
        for (let i=0; i<this.events.length; i++)
            if (this.events[i].name === eventName)
                list.push(this.events[i]);

        return list;
    }

}

exports.SignalingClientList = new SignalingClientList();