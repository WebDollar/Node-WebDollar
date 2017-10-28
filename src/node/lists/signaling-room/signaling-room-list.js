import {SocketAddress} from './../../../common/sockets/socket-address.js';
import {SignalingRoomListObject} from './signaling-room-list-object';

const colors = require('colors/safe');

/*
    The List is populated with Node Sockets who are available for WebRTC
 */

class SignalingRoomList {

    // signalingRoom = []               - storing the connected sockets
    // events = []                      - used for callbacks

    constructor(){

        console.log("SignalingRoomList constructor");

        this.signalingRoom = [];
        this.events = [];
    }

    registerSocketToSignalingRoomList(socket, params){

        if (this.searchSignalingRoomListBySocket(socket) === null){

            let signalingRoomObject = new SignalingRoomListObject(socket, params);
            this.signalingRoom.push(signalingRoomObject);

            return true;
        }

        return false;
    }

    searchSignalingRoomListBySocket(socket){

        for (let i=0; i<this.signalingRoom.length; i++)
            if (this.signalingRoom[i].socket === socket)
                return this.signalingRoom[i];

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

exports.SignalingRoomList =  new SignalingRoomList();