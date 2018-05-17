import * as io from 'socket.io-client';

import consts from 'consts/const_global'
import SocketExtend from 'common/sockets/protocol/extend-socket/Socket-Extend'
import SocketAddress from 'common/sockets/protocol/extend-socket/Socket-Address'
import NodesList from 'node/lists/Nodes-List'
import CONNECTIONS_TYPE from "node/lists/types/Connections-Type"
import NODES_TYPE from "node/lists/types/Nodes-Type";
import Blockchain from "main-blockchain/Blockchain"

let NodeExpress, NodeServer;

if (!process.env.BROWSER) {
    NodeExpress = require('node/sockets/node-server/express/Node-Express').default;
    NodeServer = require('node/sockets/node-server/sockets/Node-Server').default;
}

class NodeClient {

    // socket : null,

    constructor(){

        this.socket = null;

    }

    connectToWaitlist(waitlist, index){

        return this.connectTo( waitlist.sckAddresses[index], undefined, waitlist.level+1, waitlist.sckAddresses[index].SSL, waitlist )

    }

    connectTo(address, port, level, SSL, waitlist){

        let sckAddress = SocketAddress.createSocketAddress(address, port);

        if (sckAddress.isLocalHost() ){ //localhost, quite useless to connect to the localhost

            console.log('localhost connection, rejected', address)
            return false;
        }

        address = sckAddress.getAddress(true, true);
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

                if (port !== undefined && address.indexOf(":") === -1 || address.indexOf(":") === (address.length-1) )  address += ":"+port;

                //it is required in browser to use SSL
                if (process.env.BROWSER && consts.SETTINGS.NODE.SSL )
                    SSL = true;

                console.log("connecting... to:                ", address);

                let socket = null;
                try {

                    // params described in the documentation https://socket.io/docs/client-api#manager
                    socket = io( address, {

                        reconnection: false, //no reconnection because it is managed automatically by the WaitList
                        maxHttpBufferSize: consts.SOCKET_MAX_SIZE_BYRES,

                        connection_timeout : 20000,
                        timeout: 20000,

                        secure: SSL, //https

                        query:{
                            msg: "HelloNode",
                            version: consts.SETTINGS.NODE.VERSION,
                            uuid: consts.SETTINGS.UUID,
                            nodeType: process.env.BROWSER ? NODES_TYPE.NODE_WEB_PEER : NODES_TYPE.NODE_TERMINAL,
                            UTC: Blockchain.blockchain.timestamp.timeUTC,
                            domain: process.env.BROWSER ? "browser" : NodeServer.getServerHTTPAddress(),
                        },

                    });

                }  catch (Exception){
                    console.error("Error Connecting Node to ", address," ", Exception);
                    resolve(false);
                    return false;
                }
                this.socket = socket;


                socket.once("connect", async ( response ) =>{

                    //Connection Established

                    SocketExtend.extendSocket( socket, socket.io.opts.hostname || sckAddress.getAddress(false),  socket.io.opts.port||sckAddress.port, undefined, level );

                    console.warn("Client connected to " + socket.node.sckAddress.address);

                    let timeout = setTimeout(()=>{

                        socket.disconnect();
                        resolve(false);

                    }, 20*1000);


                    let answer = await socket.node.protocol.sendHello(["ip","uuid"]);

                    clearTimeout(timeout);

                    if (answer)
                        await this.initializeSocket(socket, ["ip", "uuid"], waitlist);
                    else
                        socket.disconnect();

                    resolve(answer);

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

                socket.connect();

            }
            catch(Exception){
                console.error("Error Raised when connecting Node to ", address, Exception);
                resolve(false);
            }

            setTimeout(()=>{
                resolve(false);
            }, 15000)

        });



    }

    async initializeSocket(validationDoubleConnectionsTypes, waitlist){

        //it is not unique... then I have to disconnect

        if (await NodesList.registerUniqueSocket(this.socket, CONNECTIONS_TYPE.CONNECTION_CLIENT_SOCKET, this.socket.node.protocol.nodeType, validationDoubleConnectionsTypes) === false){
            return false;
        }

        waitlist.socket = this.socket;
        waitlist.connected = true;

        console.log('Socket Client Initialized ' + this.socket.node.sckAddress.getAddress(true));

        this.socket.on("disconnect", () => {

            //disconnect over the time, so it was connected before

            try {
                console.warn("Client disconnected ", this.socket.node.sckAddress.getAddress(true));
                NodesList.disconnectSocket(this.socket);
            } catch (exception){

            }

            delete this.socket;

        });


        this.socket.node.protocol.propagation.initializePropagation();

    }


}

export default NodeClient;