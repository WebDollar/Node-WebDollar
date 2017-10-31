import {SignalingClientPeerObject} from './signaling-client-peer-object';
import {NodeWebPeer} from "../../../../../../node/webrtc/web_peer/node-web-peer";

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

    registerWebPeerSignalingClientListBySignal(signal, initiator) {

        let signalingClientPeerObject = null;

        if (typeof signal === 'undefined' || signal === null) signalingClientPeerObject = null;
        else signalingClientPeerObject = this.searchWebPeerSignalingClientList(signal);

        if (signalingClientPeerObject === null){

            let webPeer = new NodeWebPeer(initiator);
            signalingClientPeerObject = new SignalingClientPeerObject(webPeer);

            this.list.push(signalingClientPeerObject);
        }

        return signalingClientPeerObject;
    }

    searchWebPeerSignalingClientList(data){

        if (data === null) return null;

        //previous established connection
        for (let i = 0; i < this.list.length; i++)
            if ( this.list[i].webPeer  === data || this.list[i].webPeer.signal === data ){
                return this.list[i];
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