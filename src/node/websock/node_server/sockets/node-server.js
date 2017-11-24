let io = require('socket.io');
const colors = require('colors/safe');

import {nodeVersionCompatibility, nodeVersion, nodePort} from 'consts/const_global'
import SocketExtend from 'common/sockets/socket-extend'
import NodesList from 'node/lists/nodes-list'
import NodeProtocol from 'common/sockets/protocol/node-protocol';

import NodePropagationProtocol from 'common/sockets/protocol/node-propagation-protocol'

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
                server = io();

            } catch(Exception){
                console.log("Error Importing io() library", Exception.toString());
            }
            this.nodeServer = server;

            server.on("connection", socket => {

                SocketExtend.extendSocket(socket, socket.request.connection.remoteAddress, socket.request.connection.remotePort);

                console.log(colors.blue('New connection from ' + socket.node.sckAddress.getAddress(true)));

                socket.node.protocol.sendHello().then( (answer)=>{
                    this.initializeSocket(socket);
                });

                socket.once("disconnect", () => {
                    console.log("Socket disconnected"); console.log( socket.node.sckAddress.getAddress() );
                    NodesList.disconnectSocket(socket);
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
        if (NodesList.registerUniqueSocket(socket, "server") === false){
            return false;
        }

        console.log(colors.white('Socket Client Initialized ' + socket.node.sckAddress.getAddress(true)));


        socket.node.protocol.propagation.initializePropagation();
        socket.node.protocol.signaling.server.initializeSignalingServerService();
    }


}

export default new NodeServer();