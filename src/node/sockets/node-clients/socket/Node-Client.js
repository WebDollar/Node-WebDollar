import * as io from 'socket.io-client';

import consts from 'consts/const_global'
import SocketExtend from 'common/sockets/socket-extend'
import SocketAddress from 'common/sockets/socket-address'
import NodesList from 'node/lists/nodes-list'
import ConnectionsType from "node/lists/types/Connections-Type"

class NodeClient {

    // socket : null,

    constructor(){

        this.socket = null;

    }

    connectTo(address, port, level){

        let sckAddress = SocketAddress.createSocketAddress(address, port);

        if (sckAddress.isLocalHost() ){ //localhost, quite useless to connect to the localhost

            console.log('localhost connection, rejected', address)
            return false;
        }

        address = sckAddress.getAddress(false);
        port = sckAddress.port;

        return new Promise( (resolve) => {

            try
            {
                if ( address.length < 3 ){
                    console.log("rejecting address... invalid ",address);
                    resolve(false);
                    return false;
                }

                // in case the port is not included
                if (address.indexOf(":") === -1 || address.indexOf(":") === (address.length-1) )  address += ":"+port;

                if (address.indexOf("http" + (consts.SETTINGS.NODE.SSL ? 's' : '') +"://") === -1 )  address = "http"+ (consts.SETTINGS.NODE.SSL ? 's' : '') +"://"+address;

                console.log("connecting... to:                ", address);

                let socket = null;
                try {

                    // params described in the documentation https://socket.io/docs/client-api#manager
                    socket = io( address, {

                        reconnection: false, //no reconnection because it is managed automatically by the WaitList
                        maxHttpBufferSize: consts.SOCKET_MAX_SIZE_BYRES,

                        connection_timeout : 20000,
                        timeout: 20000,

                        secure: consts.SETTINGS.NODE.SSL, //https
                    });

                }  catch (Exception){
                    console.error("Error Connecting Node to ", address," ", Exception);
                    resolve(false);
                    return false;
                }
                this.socket = socket;


                socket.once("connect", ( response ) =>{

                    //Connection Established

                    SocketExtend.extendSocket( socket, socket.io.opts.hostname||sckAddress.getAddress(false),  socket.io.opts.port||sckAddress.port, undefined, level );

                    console.warn("Client connected to " + socket.node.sckAddress.getAddress(true) );

                    socket.node.protocol.sendHello(["ip","uuid"]).then( (answer)=>{

                        if (answer)
                            this.initializeSocket(socket, ["ip", "uuid"]);
                        else
                            socket.disconnect();

                        resolve(answer);
                    });

                });

                socket.once("connect_error", (response) =>{

                    //console.log("Client error connecting", address, response);
                    NodesList.disconnectSocket(this.socket);

                    resolve(false);
                });

                socket.once("connect_failed", (response) =>{

                    //console.log("Client error connecting (connect_failed) ", address, response);
                    NodesList.disconnectSocket(this.socket);

                    resolve(false);
                });

                socket.on("disconnect", () => {

                    //disconnect over the time, so it was connected before

                    console.warn("Client disconnected ", address);
                    NodesList.disconnectSocket(this.socket);

                });


                socket.connect();

            }
            catch(Exception){
                console.error("Error Raised when connecting Node to ", address, Exception);
                resolve(false);
            }

            resolve(true);

        });

    }

    initializeSocket(validationDoubleConnectionsTypes){

        //it is not unique... then I have to disconnect

        if (NodesList.registerUniqueSocket(this.socket, ConnectionsType.CONNECTION_CLIENT_SOCKET, this.socket.node.protocol.nodeType, validationDoubleConnectionsTypes) === false){
            return false;
        }

        console.log('Socket Client Initialized ' + this.socket.node.sckAddress.getAddress(true));

        this.socket.node.protocol.propagation.initializePropagation();

    }


}

export default NodeClient;