let ioClient = require('socket.io-client');

import {nodeVersionCompatibility, nodeVersion, nodePort} from '../../../consts/const_global.js';
import {sendRequest, sendRequestWaitOnce, sendRequestSubscribe, subscribeSocketObservable} from './../../../common/sockets/sockets.js';
import {NodeLists} from './../../lists/node-lists.js';
import {sendHello} from './../../../common/sockets/node/protocol.js';

class NodeClient {

    // socket : null,

    constructor(address){

        //console.log("NodeClient constructor");

        this.socket = null;

        if (typeof address !== 'undefined')
            this.connectTo(address);
    }

    connectTo(address){

        try
        {
            // in case the port is not included
            if (address.indexOf(":") === -1){
                address += ":"+nodePort;
            }

            console.log("connecting... to address", address);
            this.socket = ioClient(address);

            subscribeSocketObservable(this.socket, "connection").subscribe(response => {

                console.log("Client connected ", address);
                this.socket.address = address;
                sendHello(this.socket, this.initializeSocket);

            });

            subscribeSocketObservable(this.socket, "disconnect").subscribe(response => {

                console.log("Client disconnected ",  address);
                NodeLists.disconnectSocket(this.socket);

            });

            subscribeSocketObservable(this.socket, "connect_error").subscribe(response => {

                console.log("Client error connecting", address);
                NodeLists.disconnectSocket(this.socket);

            });


        }
        catch(Exception){
            console.log("Error Connecting Node to ",address," ", Exception.toString());
            return false;
        }

        return true;
    }

    initializeSocket(){

        NodeLists.checkAddSocket(this.socket, true, false);

    }


}

exports.NodeClient =  NodeClient;