let io = require('socket.io');
let p2p = require('socket.io-p2p');

import {nodeVersionCompatibility, nodeVersion, nodePort} from '../../../consts/const_global.js';
import {sendRequest, sendRequestWaitOnce, sendRequestSubscribe, subscribeSocketObservable} from './../../../common/sockets/sockets.js';
import {NodeLists} from './../../lists/node-lists.js';
import {NodeProtocol} from '../../../common/sockets/node/node-protocol.js';
import {NodePropagationProtocol} from '../../../common/sockets/node/node-propagation-protocol.js';

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
            let server = null;
            try {
                console.log(io);
                server = io();
                server.use(p2p);
            } catch(Exception){
                console.log("Error Importing io() library", Exception.toString());
            }
            this.nodeServer = server;

            server.on("connection", socket => {

                socket.address = (socket.request.connection.remoteAddress||'').toLowerCase();
                socket.port = socket.request.connection.remotePort;

                console.log('New connection from ' + socket.address + ':' + socket.port);
                NodeProtocol.sendHello(socket).then((answer)=>{
                    this.initializeSocket(socket);
                });


            });

            try {
                console.log(server);
                server.listen(nodePort);
            } catch(Exception){
                console.log("Error Calling server.listen", Exception.toString());
            }

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


        socket.once("disconnect", answer => {
            console.log("Socket disconnected", socket.address);
            NodeLists.disconnectSocket(socket);
        });

        NodePropagationProtocol.initializeSocketForPropagation(socket);

    }


}

exports.NodeServer = new NodeServer();