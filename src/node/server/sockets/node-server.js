let io = require('socket.io');

import {nodeVersionCompatibility, nodeVersion, nodePort} from '../../../consts/const_global.js';
import {sendRequest, sendRequestWaitOnce, sendRequestSubscribe, subscribeSocketObservable} from './../../../common/sockets/sockets.js';
import {NodeLists} from './../../lists/node-lists.js';
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
    }

    startServer(){

        this.nodeServer = null;

        try
        {
            let server = io();
            this.nodeServer = server;

            subscribeSocketObservable(server, "connection").subscribe(socket => {

                socket.address = (socket.request.connection.remoteAddress||'').toLowerCase();
                socket.port = socket.request.connection.remotePort;

                console.log('New connection from ' + socket.address + ':' + socket.port);
                if (sendHello(socket, this.initializeSocket))
                    this.initializeSocket(socket);

            });

            subscribeSocketObservable(server, "error").subscribe(socket => {
                console.log("Socket Error: ", socket.request.connection.remoteAddress||'');
            });

            server.listen(nodePort);


        }
        catch(Exception){
            console.log("Error Starting Node Server ", Exception.toString());
            return false;
        }

        console.log("Node Server Started");
        return true;
    }



    initializeSocket(socket){

        let isUnique = NodeLists.addUniqueSocket(socket, false, true);

        subscribeSocketObservable(this.nodeServer, "disconnect").subscribe(socket => {
            console.log("Socket disconnected", socket.request.connection.remoteAddress);
            NodeLists.disconnectSocket(socket);
        });

    }


}

exports.NodeServer = new NodeServer();