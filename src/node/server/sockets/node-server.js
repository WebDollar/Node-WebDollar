let io = require('socket.io');
import {NodeLists} from './../../lists/node-lists.js';

import {sendRequest, sendRequestWaitOnce, sendRequestSubscribe, subscribeSocketObservable} from './../../../common/sockets/sockets.js';
import {sendHello} from './../../../common/sockets/node/protocol.js';

/*
    TUTORIAL

    socket.emit('request', {); // emit an event to the socket
    io.emit('broadcast', {); // emit an event to all connected sockets
    socket.on('reply', function(){  }); // listen to the event
 */

class NodeServer {

    /*
        nodeServer : null,        //Node IO Server Socket
    */

    constructor(){

        console.log("NodeServer constructor");
        this.nodeServer = null;

        this.nodeClientsService = null;
    }

    startServer(){

        this.nodeServer = null;

        try
        {
            let server = io();

            subscribeSocketObservable(server, "connection").subscribe(socket => {
                let address = socket.handshake.address;
                console.log('New connection from ' + address.address + ':' + address.port);

                sendHello(socket, this.initializeSocket);

            });

            subscribeSocketObservable(server, "disconnect").subscribe(socket => {

            });

            server.listen(8320);

            this.nodeServer = server;
        }
        catch(Exception){
            console.log("Error Starting Node Server ", Exception.toString());
            return false;
        }

        console.log("Node Server Started");
        return true;
    }



    initializeSocket(socket){

    }


}

exports.NodeServer =  NodeServer;