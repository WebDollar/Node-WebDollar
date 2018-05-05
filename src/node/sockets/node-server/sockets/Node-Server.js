
import SocketAddress from "common/sockets/socket-address";

let io = require('socket.io');

import consts from 'consts/const_global'
import SocketExtend from 'common/sockets/socket-extend'
import NodesList from 'node/lists/nodes-list'
import NodeExpress from "./../express/Node-Express";
import CONNECTION_TYPE from "node/lists/types/Connections-Type";
import NODES_TYPE from "node/lists/types/Nodes-Type";

class NodeServer {

    /*
        nodeServer : null,        //Node IO Server Socket
    */

    constructor(){

        console.log("NodeServer constructor");
        this.nodeServer = null;

    }

    async startServer(){

        this.nodeServer = null;

        if (!NodeExpress.loaded)
            await NodeExpress.startExpress();

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

                if (socket.request._query["msg"] !== "HelloNode"){
                    socket.disconnect();
                    return
                }

                if (socket.request._query["version"] === undefined || socket.request._query["version"] < consts.SETTINGS.NODE.VERSION_COMPATIBILITY){
                    console.error("version is invalid", socket.request._query["version"]);
                    socket.disconnect();
                    return
                }

                let nodeType = socket.request._query["nodeType"];
                if (typeof nodeType  === "string") nodeType = parseInt(nodeType);

                let nodeSSL = socket.request._query["SSL"];
                if (typeof nodeSSL === "string") nodeSSL = parseInt(nodeSSL);
                if (typeof nodeSSL === "number") nodeSSL = nodeSSL === 1;

                let nodeUTC = socket.request._query["UTC"];
                if (typeof nodeUTC === "string") nodeUTC = parseInt(nodeUTC);

                if ( socket.request._query["uuid"] === undefined || [NODES_TYPE.NODE_TERMINAL, NODES_TYPE.NODE_WEB_PEER].indexOf( nodeType ) === -1) {
                    console.error("invalid uuid or nodeType");
                    socket.disconnect();
                    return;
                }

                if (NODES_TYPE.NODE_TERMINAL === nodeType && NodesList.countNodesByType(NODES_TYPE.NODE_TERMINAL) > consts.SETTINGS.PARAMS.CONNECTIONS.SERVER.MAXIMUM_CONNECTIONS_FROM_TERMINAL){
                    console.warn("too many terminal connections");
                    socket.disconnect();
                    return;
                }

                if (NODES_TYPE.NODE_WEB_PEER === nodeType && NodesList.countNodesByType(NODES_TYPE.NODE_WEB_PEER) > consts.SETTINGS.PARAMS.CONNECTIONS.SERVER.MAXIMUM_CONNECTIONS_FROM_BROWSER){
                    console.warn("too many browser connections");
                    socket.disconnect();
                    return;
                }

                //check if it is a unique connection, add it to the list
                let sckAddress = new SocketAddress(socket.request.connection.remoteAddress, socket.request.connection.remotePort, socket.request._query["uuid"]);

                let connections = NodesList.countNodeSocketByAddress( sckAddress, "all" );

                if ( connections.countUUIDs === 0 && connections.countIPs < consts.SETTINGS.PARAMS.CONNECTIONS.NO_OF_IDENTICAL_IPS ){

                    SocketExtend.extendSocket(socket, sckAddress, undefined, undefined, 1);

                    console.warn('New connection from ' + socket.node.sckAddress.getAddress(true) );

                    socket.node.protocol.justSendHello();

                    socket.node.protocol.nodeType = nodeType;
                    socket.node.protocol.nodeSSL = nodeSSL;
                    socket.node.protocol.nodeUTC = nodeUTC;
                    socket.node.protocol.helloValidated = true;

                    this.initializeSocket(socket, ["uuid"]);

                } else {

                    socket.disconnect();

                }

            });

            try {
                //multiple ports, but doesn't work

                let port = process.env.SERVER_PORT||consts.SETTINGS.NODE.PORT;

                try{
                    server.listen (NodeExpress.server);
                } catch (Exception) {
                    console.error( "Couldn't open server on port ", port, " try next port") ;
                    process.exit(1);
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
        if (NodesList.registerUniqueSocket(socket, CONNECTION_TYPE.CONNECTION_SERVER_SOCKET, socket.node.protocol.nodeType, validationDoubleConnectionsTypes) === false){
            return false;
        }

        socket.once("disconnect", () => {

            try {
                console.log("Socket disconnected", socket.node.sckAddress.getAddress());
                NodesList.disconnectSocket(socket);
            } catch (exception){

            }

        });

        console.log('Socket Server Initialized ' + socket.node.sckAddress.getAddress(true));


        socket.node.protocol.propagation.initializePropagation();
        socket.node.protocol.signaling.server.initializeSignalingServerService();
    }


}

export default new NodeServer();