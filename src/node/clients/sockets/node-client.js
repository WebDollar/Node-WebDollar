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

        let that = this;
        return new Promise(function(resolve) {

            try
            {
                // in case the port is not included
                if (address.indexOf(":") === -1){
                    address += ":"+nodePort;
                }

                if (address.indexOf("http://") === -1 ){
                    address = "http://"+address;
                }

                if (address.length < 4){
                    resolve(false);
                    return false;
                }

                console.log("connecting... to address", address);
                that.socket = ioClient(address);

                subscribeSocketObservable(that.socket, "connection").subscribe(response => {

                    console.log("Client connected ", address);
                    that.socket.address = address;
                    sendHello(that.socket, that.initializeSocket);

                    resolve(true);

                });

                subscribeSocketObservable(that.socket, "connect_error").subscribe(response => {

                    console.log("Client error connecting", address);
                    NodeLists.disconnectSocket(that.socket);

                    resolve(false);

                });


            }
            catch(Exception){
                console.log("Error Connecting Node to ", address," ", Exception.toString());
                resolve(false);
            }

            resolve(true);

        });

    }

    initializeSocket(socket){

        NodeLists.checkAddSocket(socket, true, false);

        subscribeSocketObservable(socket, "disconnect").subscribe(response => {

            console.log("Client disconnected ",  address);
            NodeLists.disconnectSocket(socket);

        });

    }


}

exports.NodeClient =  NodeClient;