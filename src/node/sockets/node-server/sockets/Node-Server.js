import CONNECTION_TYPE from "../../../lists/types/Connections-Type";

let io = require('socket.io');

import consts from 'consts/const_global'
import SocketExtend from 'common/sockets/socket-extend'
import NodesList from 'node/lists/nodes-list'
import NodeExpress from "./../express/Node-Express";
import ConnectionsType from "node/lists/types/Connections-Type";

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

                SocketExtend.extendSocket(socket, socket.request.connection.remoteAddress, socket.request.connection.remotePort, undefined, 1);

                console.warn('New connection from ' + socket.node.sckAddress.getAddress(true));

                socket.node.protocol.sendHello(["uuid"]).then( (answer)=>{

                    if (answer)
                        this.initializeSocket(socket, ["uuid"]);

                });

                socket.once("disconnect", () => {
                    console.log("Socket disconnected", socket.node.sckAddress.getAddress());
                    NodesList.disconnectSocket(socket);
                });

            });

            try {
                //multiple ports, but doesn't work

                let port = process.env.SERVER_PORT||consts.SETTINGS.NODE.PORT;

                try{
                    server.listen (NodeExpress.server);
                } catch (Exception) {
                    console.error( "Couldn't open server on port ", port, " try next port") ;
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
        if (NodesList.registerUniqueSocket(socket, ConnectionsType.CONNECTION_SERVER_SOCKET, socket.node.protocol.nodeType, validationDoubleConnectionsTypes) === false){
            return false;
        }

        console.log('Socket Server Initialized ' + socket.node.sckAddress.getAddress(true));


        socket.node.protocol.propagation.initializePropagation();
        socket.node.protocol.signaling.server.initializeSignalingServerService();
    }


}

export default new NodeServer();