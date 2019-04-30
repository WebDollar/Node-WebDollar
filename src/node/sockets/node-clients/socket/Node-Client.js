import * as io from 'socket.io-client';

import consts from 'consts/const_global'
import SocketExtend from 'common/sockets/protocol/extend-socket/Socket-Extend'
import SocketAddress from 'common/sockets/protocol/extend-socket/Socket-Address'
import NodesList from 'node/lists/Nodes-List'
import CONNECTIONS_TYPE from "node/lists/types/Connection-Type"
import NODE_TYPE from "node/lists/types/Node-Type";
import Blockchain from "main-blockchain/Blockchain"
import NodePropagationProtocol from 'common/sockets/protocol/Node-Propagation-Protocol'
import NODES_CONSENSUS_TYPE from "node/lists/types/Node-Consensus-Type";

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
        address = address.replace('::ffff:', '');


        return new Promise( async (resolve) => {

            //if (!waitlist.isFallback) return false;
            
            let timeoutTotal =  8*1000 + Math.floor( Math.random()*10*1000) + ( !process.env.BROWSER ? 10*1000+Math.random()*30*1000 : 0 );

            try {

                if ( address.length < 3 ){
                    console.log("rejecting address... invalid ",address);
                    return resolve(false);
                }

                // in case the port is not included

                if (port && address.indexOf(":") === -1 || address.indexOf(":") === (address.length-1) )  address += ":"+port;

                //it is required in browser to use SSL
                if (process.env.BROWSER && consts.SETTINGS.NODE.SSL )
                    SSL = true;

                console.log("connecting to...                ", address);

                let socket;
                try {

                    // params described in the documentation https://socket.io/docs/client-api#manager
                    this.socket = socket = io( address, {

                        reconnection: false, //no reconnection because it is managed automatically by the WaitList
                        maxHttpBufferSize: consts.SOCKET_MAX_SIZE_BYRES,

                        connection_timeout : timeoutTotal,
                        timeout: timeoutTotal,

                        secure: SSL, //https

                        query:{
                            msg: "HelloNode",
                            version: consts.SETTINGS.NODE.VERSION,
                            uuid: consts.SETTINGS.UUID,
                            nodeType: process.env.BROWSER ? NODE_TYPE.NODE_WEB_PEER : NODE_TYPE.NODE_TERMINAL,
                            nodeConsensusType: waitlist.nodeConsensusType,
                            UTC: Blockchain.blockchain.timestamp.timeUTC,
                            domain: process.env.BROWSER ? "browser" : await NodeServer.getServerHTTPAddress(),
                        },

                    });

                }  catch (Exception){
                    console.error("Error Connecting Node to ", address," ", Exception);
                    return resolve(false);
                }

                if ( Blockchain.MinerPoolManagement.minerPoolStarted && waitlist.nodeConsensusType !== NODES_CONSENSUS_TYPE.NODE_CONSENSUS_SERVER)
                    throw {message: "You switched to pool"};

                NodePropagationProtocol.initializeNodesSimpleWaitlist(socket);

                socket.once("connect", async ( response ) =>{
                    SocketExtend.extendSocket( socket, socket.io.opts.hostname || sckAddress.getAddress(false),  socket.io.opts.port||sckAddress.port, undefined, level );
                    console.warn("Client connected to " + socket.node.sckAddress.address);
                });


                socket.once("HelloNode", async (data) => {

                    try{

                        if (data) {
                            if (await socket.node.protocol.processHello(data, {"ip":true,"uuid":true})) {
                                await this.initializeSocket({"ip": true, "uuid": true}, waitlist);
                                resolve(true);
                            }
                        } else
                            resolve(false);

                    } catch (exception){

                    }

                });

                socket.once("connect_error", response =>{

                    //console.log("Client error connecting", address, response);
                    resolve(false);

                });

                socket.once("connect_failed", response =>{

                    //console.log("Client error connecting (connect_failed) ", address, response);
                    resolve(false);

                });

                socket.on("disconnect", ()=>{
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
            }, timeoutTotal + Math.floor(Math.random() * 5*1000));

        });



    }

    async initializeSocket(validationDoubleConnectionsTypes, waitlist){

        //it is not unique... then I have to disconnect

        if ( Blockchain.MinerPoolManagement.minerPoolStarted && waitlist.nodeConsensusType !== NODES_CONSENSUS_TYPE.NODE_CONSENSUS_SERVER) {
            console.error("socket disconnected by not being minerPool");
            return false;
        }

        if (await NodesList.registerUniqueSocket(this.socket, CONNECTIONS_TYPE.CONNECTION_CLIENT_SOCKET, this.socket.node.protocol.nodeType, waitlist.nodeConsensusType,  validationDoubleConnectionsTypes) === false)
            return false;

        waitlist.socketConnected(this.socket);

        console.log('Socket Client Initialized ' + this.socket.node.sckAddress.getAddress(true));

        this.socket.on("disconnect", async () => {

            //disconnect over the time, so it was connected before

            console.warn("Client disconnected ", this.socket.node.sckAddress.getAddress(true));
            await NodesList.disconnectSocket(this.socket);

        });


        this.socket.node.protocol.propagation.initializePropagation();

    }


}

export default NodeClient;
