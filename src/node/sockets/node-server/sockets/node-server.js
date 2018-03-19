let io = require('socket.io');

import consts from 'consts/const_global'
import SocketExtend from 'common/sockets/socket-extend'
import NodesList from 'node/lists/nodes-list'
import NodeProtocol from 'common/sockets/protocol/node-protocol'

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
                server = io({
                    maxHttpBufferSize:consts.SOCKET_MAX_SIZE_BYRES,
                });

            } catch(Exception){
                console.log("Error Importing io() library", Exception);
            }
            this.nodeServer = server;

            server.on("connection", socket => {

                SocketExtend.extendSocket(socket, socket.request.connection.remoteAddress, socket.request.connection.remotePort, undefined, 1);

                console.warn('New connection from ' + socket.node.sckAddress.getAddress(true));

                socket.node.protocol.sendHello(["uuid"]).then( (answer)=>{
                    this.initializeSocket(socket, ["uuid"]);
                });

                socket.once("disconnect", () => {
                    console.log("Socket disconnected", socket.node.sckAddress.getAddress());
                    NodesList.disconnectSocket(socket);
                });

            });

            try {
                console.log("SERVER typeof", typeof server);

                //multiple ports, but doesn't work

                let port = process.env.SERVER_PORT||consts.NODE_PORT;
                try{
                    server.listen (port);
                } catch (Exception) {
                    console.error( "Couldn't open server on port ", port, " try next port") ;
                    server.listen (port+1);
                }
            } catch(Exception){
                console.error("Error Calling node_server.listen", Exception);
            }

        }
        catch(Exception){
            console.error("Error Starting Node Server ", Exception);
            return false;
        }

        console.log("Node Server Started");
        return true;
    }



    initializeSocket(socket, validationDoubleConnectionsTypes){

        //it is not unique... then I have to disconnect
        if (NodesList.registerUniqueSocket(socket, "server", validationDoubleConnectionsTypes) === false){
            return false;
        }

        console.log('Socket Server Initialized ' + socket.node.sckAddress.getAddress(true));


        socket.node.protocol.propagation.initializePropagation();
        socket.node.protocol.signaling.server.initializeSignalingServerService();
    }


}

export default new NodeServer();