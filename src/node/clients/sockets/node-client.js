import * as io from 'socket.io-client';

import {nodeVersionCompatibility, nodeVersion, nodePort} from '../../../consts/const_global.js';
import {sendRequest, sendRequestWaitOnce, sendRequestSubscribe, subscribeSocketObservable} from './../../../common/sockets/sockets.js';
import {NodeLists} from './../../lists/node-lists.js';
import {sendHello} from './../../../common/sockets/node/protocol.js';

class NodeClient {

    // socket : null,

    constructor(){

        //console.log("NodeClient constructor");

        this.socket = null;
    }

    connectTo(address, port){

        if (typeof port === 'undefined') port = nodePort;
        let that = this;

        return new Promise(function(resolve) {

            try
            {
                if (address.length < 3){
                    console.log("rejecting address",address);
                    resolve(false);
                    return false;
                }

                // in case the port is not included
                if (address.indexOf(":") === -1)  address += ":"+port;
                if (address.indexOf("http://") === -1 )  address = "http://"+address;

                console.log("connecting... to address", address);
                let socket = io.connect(address, {});
                that.socket = socket;


                //console.log(socket);

                subscribeSocketObservable(socket, "connect").subscribe(response => {

                    socket.address = (socket.io.opts.hostname||'').toLowerCase();
                    socket.port = socket.io.opts.port;

                    console.log("Client connected to ", socket.address);
                    sendHello(socket).then( (answer)=>{
                        that.initializeSocket(socket);
                    });

                    resolve(true);
                });

                subscribeSocketObservable(socket, "connect_error").subscribe(response => {

                    console.log("Client error connecting", address);
                    NodeLists.disconnectSocket(that.socket);

                    resolve(false);
                });
                subscribeSocketObservable(that.socket, "connect_failed").subscribe(response => {

                    console.log("Client error connecting (connect_failed) ", address);
                    NodeLists.disconnectSocket(socket);

                    resolve(false);
                });

                socket.connect();

            }
            catch(Exception){
                console.log("Error Connecting Node to ", address," ", Exception.toString());
                resolve(false);
            }

            resolve(true);

        });

    }

    initializeSocket(socket){

        let isUnique = NodeLists.addUniqueSocket(socket, true, false);

        subscribeSocketObservable(socket, "disconnect").subscribe(response => {

            console.log("Client disconnected ",  socket.address);
            NodeLists.disconnectSocket(socket);

        });

    }


}

exports.NodeClient =  NodeClient;