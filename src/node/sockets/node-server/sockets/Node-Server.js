import NODES_CONSENSUS_TYPE from "node/lists/types/Node-Consensus-Type";
import SocketAddress from "common/sockets/protocol/extend-socket/Socket-Address";

const io = require('socket.io');

import consts from 'consts/const_global'
import SocketExtend from 'common/sockets/protocol/extend-socket/Socket-Extend'
import NodesList from 'node/lists/Nodes-List'
import NodeExpress from "./../express/Node-Express";
import CONNECTION_TYPE from "node/lists/types/Connection-Type";
import NODE_TYPE from "node/lists/types/Node-Type";
import NodePropagationList from 'common/sockets/protocol/Node-Propagation-List'
import Blockchain from "main-blockchain/Blockchain"
import NodesWaitlist from 'node/lists/waitlist/Nodes-Waitlist'
import AGENT_STATUS from "common/blockchain/interface-blockchain/agents/Agent-Status";

const publicIp = require('public-ip');

const TIME_DISCONNECT_TERMINAL = 5*60*1000;
const TIME_DISCONNECT_TERMINAL_TOO_OLD_BLOCKS = 5*60*1000;

const ROOMS = {

    TERMINALS:{
        TIME_TO_PASS_TO_CONNECT_NEW_CLIENT : 4*1000,
        SERVER_FREE_ROOM : 20,
    },

    BROWSERS:{
        TIME_TO_PASS_TO_CONNECT_NEW_CLIENT : 4*1000,
        SERVER_FREE_ROOM : 20,
    },

};

class NodeServer {

    /*
        nodeServer : null,        //Node IO Server Socket
    */

    constructor() {

        console.log("NodeServer constructor");
        this.nodeServer = null;

        this.loaded = false;

        setInterval(this._disconenctOldSockets.bind(this), 30 * 1000);

        this._rooms = {

            terminals:{
                timeLastConnected : 0,
                serverSits : ROOMS.TERMINALS.SERVER_FREE_ROOM,
            },

            browsers:{
                timeLastConnected : 0,
                serverSits : ROOMS.BROWSERS.SERVER_FREE_ROOM,
            },

        };

    }

    async startServer(){

        this.nodeServer = null;

        let expressOpened = await NodeExpress.startExpress();
        if (!expressOpened) return false;

        if (!consts.OPEN_SERVER) return false;

        if (this.loaded) return;

        try
        {

            console.warn("Starting Socket.io Server");

            let server = null;
            try {

                server = io({
                    maxHttpBufferSize:consts.SOCKET_MAX_SIZE_BYRES,
                });

            } catch(Exception){
                console.log("Error Importing io() library", Exception);
            }
            this.nodeServer = server;

            console.warn("Starting Socket.io was started successfully");

            server.on("connection", async (socket) => {

                if (!this.loaded) return;

                if (socket.request._query["msg"] !== "HelloNode"){
                    console.error("No Hello Msg");
                    socket.disconnect();
                    return
                }

                if (socket.request._query["version"] === undefined || socket.request._query["version"] < consts.SETTINGS.NODE.VERSION_COMPATIBILITY){
                    if (Math.random() < 0.05)
                        console.error("version is invalid", socket.request._query["version"]);
                    socket.disconnect();
                    return
                }

                if ( socket.request._query["uuid"] === consts.SETTINGS.UUID )
                    return false;

                let nodeType = socket.request._query["nodeType"];
                if (typeof nodeType  === "string") nodeType = parseInt(nodeType);

                let nodeConsensusType = socket.request._query["nodeConsensusType"];
                if (typeof nodeConsensusType === "string") nodeConsensusType = parseInt(nodeConsensusType);

                let nodeDomain = socket.request._query["domain"];
                if ( nodeDomain === undefined) nodeDomain = "";

                if (nodeDomain.indexOf("my-ip:")>=0)
                    nodeDomain = nodeDomain.replace("my-ip", socket.request.connection.remoteAddress);

                let nodeUTC = socket.request._query["UTC"];
                if (typeof nodeUTC === "string") nodeUTC = parseInt(nodeUTC);

                if ( socket.request._query["uuid"] === undefined || [NODE_TYPE.NODE_TERMINAL, NODE_TYPE.NODE_WEB_PEER].indexOf( nodeType ) === -1) {
                    console.error("invalid uuid or nodeType");
                    socket.disconnect();
                    return;
                }


                if ( (Blockchain.PoolManagement !== undefined && Blockchain.PoolManagement._poolStarted && nodeConsensusType !== NODES_CONSENSUS_TYPE.NODE_CONSENSUS_SERVER) ||
                     (Blockchain.ServerPoolManagement !== undefined && Blockchain.ServerPoolManagement._serverPoolStarted  && nodeConsensusType !== NODES_CONSENSUS_TYPE.NODE_CONSENSUS_SERVER)){


                    if (Math.random() < 0.1)
                        console.error("disconnecting user for being simple node", nodeConsensusType);

                    socket.disconnect();
                    return;

                }

                //avoid allowing
                if (!Blockchain.blockchain.agent.consensus){
                    socket.disconnect();
                    return;
                }

                let semiPublicKeyConsensus = socket.request._query["semiPublicKeyConsensus"];

                if (consts.MINING_POOL.SEMI_PUBLIC_KEY_CONSENSUS === undefined || consts.MINING_POOL.SEMI_PUBLIC_KEY_CONSENSUS.indexOf(semiPublicKeyConsensus) === -1 )
                    if (NODE_TYPE.NODE_TERMINAL === nodeType && NodesList.countNodesByType( NODE_TYPE.NODE_TERMINAL ) > (Blockchain.isPoolActivated ?   consts.SETTINGS.PARAMS.CONNECTIONS.TERMINAL.SERVER.MAXIMUM_CONNECTIONS_FROM_TERMINAL_POOL : consts.SETTINGS.PARAMS.CONNECTIONS.TERMINAL.SERVER.MAXIMUM_CONNECTIONS_FROM_TERMINAL) ) {

                        //be sure it is not a fallback node
                        let waitlist = NodesWaitlist._searchNodesWaitlist(nodeDomain, undefined, NODE_TYPE.NODE_TERMINAL); //it should need a confirmation

                        if (nodeDomain === '' || nodeDomain === undefined || waitlist.waitlist === null || !waitlist.waitlist.isFallback) {

                            if (Math.random() < 0.05) console.warn("too many terminal connections");
                            return NodePropagationList.propagateWaitlistSimple(socket, nodeType, true); //it will also disconnect the socket

                        }

                    } else

                    if (NODE_TYPE.NODE_WEB_PEER === nodeType && ( (NodesList.countNodesByType(NODE_TYPE.NODE_WEB_PEER) > (Blockchain.isPoolActivated ?   consts.SETTINGS.PARAMS.CONNECTIONS.TERMINAL.SERVER.MAXIMUM_CONNECTIONS_FROM_BROWSER_POOL : consts.SETTINGS.PARAMS.CONNECTIONS.TERMINAL.SERVER.MAXIMUM_CONNECTIONS_FROM_BROWSER)) || Blockchain.blockchain.agent.status === AGENT_STATUS.AGENT_STATUS_NOT_SYNCHRONIZED) && !consts.DEBUG) {

                        if (Math.random() < 0.05) console.warn("too many browser connections");
                        return NodePropagationList.propagateWaitlistSimple(socket, nodeType, true); //it will also disconnect the socket

                    }


                if (NODE_TYPE.NODE_TERMINAL === nodeType && this._rooms.terminals.serverSits <= 0)

                    if (new Date().getTime() - this._rooms.terminals.timeLastConnected >= ROOMS.TERMINALS.TIME_TO_PASS_TO_CONNECT_NEW_CLIENT){

                        this._rooms.terminals.serverSits = (Blockchain.isPoolActivated ? 10 : 1 ) * ROOMS.TERMINALS.SERVER_FREE_ROOM;
                        this._rooms.terminals.timeLastConnected = new Date().getTime();

                    }else {

                        let waitlist = NodesWaitlist._searchNodesWaitlist(nodeDomain, undefined, NODE_TYPE.NODE_TERMINAL); //it should need a confirmation
                        if ( waitlist === null || waitlist.waitlist === null) //it will also disconnect the socket
                            return  await NodePropagationList.propagateWaitlistSimple(socket, nodeType, true);

                    }


                else if (NODE_TYPE.NODE_WEB_PEER === nodeType && this._rooms.browsers.serverSits <= 0)
                        if (new Date().getTime() - this._rooms.browsers.timeLastConnected >= ROOMS.BROWSERS.TIME_TO_PASS_TO_CONNECT_NEW_CLIENT) {

                            this._rooms.browsers.serverSits = (Blockchain.isPoolActivated ? 10 : 1 )  * ROOMS.BROWSERS.SERVER_FREE_ROOM;
                            this._rooms.browsers.timeLastConnected = new Date().getTime();

                        } else return NodePropagationList.propagateWaitlistSimple(socket, nodeType, true); //it will also disconnect the socket


                //check if it is a unique connection, add it to the list
                let sckAddress = new SocketAddress(socket.request.connection.remoteAddress, socket.request.connection.remotePort, socket.request._query["uuid"]);

                let connections = NodesList.countNodeSocketByAddress( sckAddress, "all" );

                //in case it is a pool open
                if ( connections.countUUIDs === 0 && connections.countIPs < ( Blockchain.isPoolActivated ? consts.MINING_POOL.CONNECTIONS.NO_OF_IDENTICAL_IPS : consts.SETTINGS.PARAMS.CONNECTIONS.NO_OF_IDENTICAL_IPS )){

                    SocketExtend.extendSocket(socket, sckAddress, undefined, undefined, 1);

                    if ( Math.random() < 0.3)
                        console.warn('New connection from ' + socket.node.sckAddress.getAddress(true) + " "+ (nodeType === NODE_TYPE.NODE_WEB_PEER ? "browser" : "terminal") );

                    if (nodeType === NODE_TYPE.NODE_TERMINAL ) this._rooms.terminals.serverSits--;
                    else if (nodeType === NODE_TYPE.NODE_WEB_PEER ) this._rooms.browsers.serverSits--;

                    if (await socket.node.protocol.sendHello(["uuid","ip", "port"], false) === false){

                        socket.disconnect();
                        return false;

                    }

                    socket.node.protocol.nodeType = nodeType;
                    socket.node.protocol.nodeUTC = nodeUTC;
                    socket.node.protocol.nodeDomain = nodeDomain;

                    socket.node.protocol.nodeConsensusType = nodeConsensusType || NODES_CONSENSUS_TYPE.NODE_CONSENSUS_PEER;

                    socket.node.protocol.helloValidated = true;

                    await this.initializeSocket(socket, ["uuid"]);

                } else {

                    await NodePropagationList.propagateWaitlistSimple(socket, nodeType, true); //it will also disconnect the socket

                }

            });

            try {
                //multiple ports, but doesn't work

                server.listen (NodeExpress.server).on('error',  (err) => {

                    console.error( "Couldn't open server on port ", NodeExpress.port, " try next port") ;
                    this.loaded = false;

                    throw err;

                });

                this.loaded = true;

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



    async initializeSocket(socket, validationDoubleConnectionsTypes){

        //it is not unique... then I have to disconnect
        if (await NodesList.registerUniqueSocket(socket, CONNECTION_TYPE.CONNECTION_SERVER_SOCKET, socket.node.protocol.nodeType, socket.node.protocol.nodeConsensusType, validationDoubleConnectionsTypes) === false){
            return false;
        }

        socket.once("disconnect", async () => {

            try {
                await NodesList.disconnectSocket(socket);
            } catch (exception){

            }

        });

        socket.node.protocol.propagation.initializePropagation();
        socket.node.protocol.signaling.server.initializeSignalingServerService();
    }

    async getServerHTTPAddress(getIP) {


        if (NodeExpress === undefined) return '';

        if ( !this.loaded )
            await NodeExpress.startExpress();


        if (NodeExpress.port === 0) return '';
        if (NodeExpress.domain  === '') return '';

        if ( getIP ){

            return 'http' + ( NodeExpress.SSL ? 's' : '') + '://' + await publicIp.v4() + ":" + NodeExpress.port;

        }

        return 'http' + ( NodeExpress.SSL ? 's' : '') + '://' + NodeExpress.domain  + ":" + NodeExpress.port;


    }

    _disconenctOldSockets() {

        let time = new Date().getTime();

        //disconnect unresponsive nodes
        for (let i = 0; i < NodesList.nodes.length; i++)
            if (NodesList.nodes[i].socket.node !== undefined && NodesList.nodes[i].socket.node.protocol.nodeType === NODE_TYPE.NODE_TERMINAL)

                if (NodesList.nodes[i].date - time > TIME_DISCONNECT_TERMINAL_TOO_OLD_BLOCKS) {

                    if (NodesList.nodes[i].socket.node.protocol.blocks === NodesList.nodes[i].socket.node.protocol.blocksPrevious){

                        NodesList.nodes[i].socket.node.protocol.sendLastBlock();

                        setTimeout(() => {

                            if ( NodesList.nodes[i] )
                                NodesList.nodes[i].socket.disconnect();

                        }, 3000);

                    } else {

                        NodesList.nodes[i].socket.node.protocol.blocksPrevious = NodesList.nodes[i].socket.node.protocol.blocks;

                    }

                }


        if (!Blockchain.isPoolActivated ) {

            if (NodesList.countNodesByType(NODE_TYPE.NODE_TERMINAL) > consts.SETTINGS.PARAMS.CONNECTIONS.TERMINAL.SERVER.MAXIMUM_CONNECTIONS_FROM_TERMINAL / 2) {

                for (let i = 0; i < NodesList.nodes.length; i++)
                    if (NodesList.nodes[i].socket.node !== undefined && NodesList.nodes[i].socket.node.protocol.nodeType === NODE_TYPE.NODE_TERMINAL)
                        if (!NodesList.nodes[i].isFallback && NodesList.nodes[i].date - time > TIME_DISCONNECT_TERMINAL)
                            NodesList.nodes[i].socket.disconnect();

            }

        }



    }

}

export default new NodeServer();