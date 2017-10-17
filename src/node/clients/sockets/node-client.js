let ioClient = require('socket.io-client');

import {nodeVersionCompatibility, nodeVersion} from '../../../consts/const_global.js';
import {sendRequest, sendRequestWaitOnce, sendRequestSubscribe, subscribeSocketObservable} from './../../../common/sockets/sockets.js';

import {NodeLists} from './../../lists/node-lists.js';

class NodeClient {

    // socket : null,

    constructor(address){

        console.log("NodeClient constructor");

        this.socket = null;

        if (typeof address === 'undefined')
            this.connectTo(address);
    }

    connectTo(address){

        try
        {
            this.socket = ioClient(address);

            this.socket.address = address;

            subscribeSocketObservable(this.socket, "connection").subscribe(response => {

                console.log("Client connected");

            });

            subscribeSocketObservable(this.socket, "disconnect").subscribe(response => {

                console.log("Client connected");

            });


            this.sendHello(this.socket, this.initializeSocket);

        }
        catch(Exception){
            console.log("Error Connecting Node to ",address);
            console.log(" Exception", Exception.toString());
            return false;
        }

        return true;
    }

    initializeSocket(){

    }


}

exports.NodeClient =  NodeClient;