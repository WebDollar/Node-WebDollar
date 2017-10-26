let io = require('socket.io');

import {nodeVersionCompatibility, nodeVersion, nodePort} from '../../../../consts/const_global.js';
import {SocketExtend} from '../../../../common/sockets/socket-extend.js';
import {NodeLists} from '../../../lists/node-lists.js';
import {NodeProtocol} from '../../../../common/sockets/protocol/node-protocol.js';
import {NodePropagationProtocol} from '../../../../common/sockets/protocol/node-propagation-protocol.js';

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

                SocketExtend.extendSocket(socket, socket.request.connection.remoteAddress, socket.request.connection.remotePort);

                console.log('New connection from ' + socket.node.sckAddress.getAddress(true));

                socket.node.protocol.sendHello().then( (answer)=>{
                    this.initializeSocket(socket);
                });

            });

            try {
                console.log(typeof server);
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

        //it is not unique... then I have to disconnect
        if (NodeLists.addUniqueSocket(socket, "server") === false){
            return false;
        }


        socket.once("disconnect", answer => {
            console.log("Socket disconnected", socket.node.sckAddress.getAddress());
            NodeLists.disconnectSocket(socket);
        });

        socket.once("close", answer => {
            console.log("Socket closed ", socket.node.sckAddress.getAddress());
            NodeLists.disconnectSocket(socket);
        });

        socket.node.protocol.propagation.initializePropagation();
        socket.node.protocol.propagation.initializeSignalsAccepting();
    }


}

exports.NodeServer = new NodeServer();