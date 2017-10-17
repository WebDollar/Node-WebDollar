let ioClient = require('socket.io-client');
let constGlobal = require('../../../consts/const_global.js');

import {sendRequest, sendRequestWaitOnce, sendRequestSubscribe, subscribeSocketObservable} from './../../../common/sockets/sockets.js';

class NodeClient {

    // socket : null,

    constructor(){

        console.log("NodeClient constructor");

        this.socket = null;
        this.onConnect = null;
        this.onDisconnect = null;
    }

    connectTo(address){

        try
        {
            let client = ioClient(address);

            this.socket = client;

            subscribeSocketObservable(this.socket, "connection").subscribe(response => {

                console.log("Client connected");

                if (typeof this.onConnect !== 'undefined')
                    this.onConnect(client);

            });

            subscribeSocketObservable(this.socket, "disconnect").subscribe(response => {

                console.log("Client connected");

                if (typeof this.onConnect !== 'undefined')
                    this.onConnect(client);

            });


            sendRequestWaitOnce(this.socket, "HelloNode",{
                version:constGlobal.nodeVersion,
            }).then(response =>{

                console.log("RECEIVED HELLO NODE BACK", response);

            });

        }
        catch(Exception){
            console.log("Error Connecting Node to ",address);
            console.log(" Exception", Exception.toString());
            return false;
        }

        return true;
    }

    startDiscoverOtherNodes(){

    }


}

exports.NodeClient =  NodeClient;