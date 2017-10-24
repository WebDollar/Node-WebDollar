let io = require('socket.io');

import {nodeVersionCompatibility, nodeVersion, nodePort} from '../../../../consts/const_global.js';
import {sendRequest} from '../../../../common/sockets/sockets.js';
import {NodeLists} from '../../../lists/node-lists.js';
import {NodeProtocol} from '../../../../common/sockets/node/node-protocol.js';
import {SocketAddress} from '../../../../common/sockets/socket-address.js';
import {NodePropagationProtocol} from '../../../../common/sockets/node/node-propagation-protocol.js';

/*
    TUTORIAL

    socket.emit('request', {); // emit an event to the socket
    io.emit('broadcast', {); // emit an event to all connected socket
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
                console.log(typeof io);
                server = io();

            } catch(Exception){
                console.log("Error Importing io() library", Exception.toString());
            }
            this.nodeServer = server;

            server.on("connection", socket => {

                socket.sckAddress = SocketAddress(socket, socket.request.connection.remoteAddress, socket.request.connection.remotePort);

                console.log('New connection from ' + socket.sckAddress.toString() + ':' + socket.sckAddress.port);

                NodeProtocol.sendHello(socket).then( (answer)=>{
                    this.initializeSocket(socket);
                });

            });

            try {
                console.log(server);
                server.listen(nodePort);
            } catch(Exception){
                console.log("Error Calling node_server.listen", Exception.toString());
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
            console.log("Socket disconnected", socket.sckAddress.toString());
            NodeLists.disconnectSocket(socket);
        });

        this.initializeWebRTCSignals(socket);

        NodePropagationProtocol.initializeSocketForPropagation(socket);
    }


    initializeWebRTCSignals(socket){

        socket.on("pools/signal/initialize", answer =>{

        });

        socket.on("pools/signal/join", answer =>{

        });
    }

}

exports.NodeServer = new NodeServer();