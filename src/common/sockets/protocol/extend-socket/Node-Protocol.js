import consts from 'consts/const_global'
import NodesList from 'node/lists/Nodes-List'
import NODE_TYPE from "node/lists/types/Node-Type"
import CONNECTION_TYPE from "node/lists/types/Connection-Type";
import Blockchain from "main-blockchain/Blockchain"
import NODES_CONSENSUS_TYPE from "node/lists/types/Node-Consensus-Type";
import Serialization from "../../../utils/Serialization";

let NodeExpress, NodeServer;

if (!process.env.BROWSER) {
    NodeExpress = require('node/sockets/node-server/express/Node-Express').default;
    NodeServer = require('node/sockets/node-server/sockets/Node-Server').default;
}

class NodeProtocol {

    /*
        HELLO PROTOCOL
     */


    async justSendHello(){

        return this.node.sendRequest("HelloNode", {
            version: consts.SETTINGS.NODE.VERSION,
            uuid: consts.SETTINGS.UUID,
            nodeType: process.env.BROWSER ? NODE_TYPE.NODE_WEB_PEER : NODE_TYPE.NODE_TERMINAL,
            domain: process.env.BROWSER ? "browser" : await NodeServer.getServerHTTPAddress(),
            UTC: Blockchain.blockchain.timestamp.timeUTC,
        });

    }

    processHello( response, validationDoubleConnectionsTypes ){

        if (!response || typeof response !== "object" ) {
            console.error("No Hello");
            return false;
        }

        if (!response.uuid || !response.version ) {
            console.error("hello received, but there is not uuid or version", response);
            return false;
        }

        if (response.version < Blockchain.versionCompatibility){
            console.log("hello received, VERSION is not right", response.version, Blockchain.versionCompatibility);
            return false;
        }

        if ( response.nodeType !== NODE_TYPE.NODE_TERMINAL && response.nodeType !== NODE_TYPE.NODE_WEB_PEER ){
            console.error("invalid node type", response);
            return false;
        }

        if (NODE_TYPE.NODE_TERMINAL === response.nodeType && NodesList.countNodesByType(NODE_TYPE.NODE_TERMINAL) > consts.SETTINGS.PARAMS.CONNECTIONS.BROWSER.CLIENT.MAXIMUM_CONNECTIONS_FROM_TERMINAL){
            console.warn("too many terminal connections");
            return false;
        }

        if (response.uuid === consts.SETTINGS.UUID)
            return false;

        this.node.sckAddress.uuid = response.uuid;

        //check if it is a unique connection, add it to the list
        let connections = NodesList.countNodeSocketByAddress(this.node.sckAddress, "all");

        if (validationDoubleConnectionsTypes.uuid && connections.countUUIDs !== 0 ) return false;
        if (validationDoubleConnectionsTypes.ip && connections.countIPs > ( Blockchain.isPoolActivated ? consts.MINING_POOL.CONNECTIONS.NO_OF_IDENTICAL_IPS : consts.SETTINGS.PARAMS.CONNECTIONS.NO_OF_IDENTICAL_IPS   ))  return false;

        console.log("RECEIVED HELLO NODE BACK", response.version);

        this.node.protocol.nodeType = response.nodeType;
        this.node.protocol.nodeConsensusType = response.nodeConsensusType || NODES_CONSENSUS_TYPE.NODE_CONSENSUS_PEER;

        this.node.protocol.nodeDomain = response.domain;

        this.node.protocol.nodeUTC = response.UTC;
        this.node.protocol.helloValidated = true;

        return true;
    }



    /**
     * boradcast to every sockets except the exceptSockets
     * @param request
     * @param data
     * @param type
     * @param exceptSockets
     */
    static broadcastRequest (request, data, connectionType, exceptSockets){

        if (exceptSockets === "all") return true;

        let nodes = NodesList.getNodesByConnectionType(connectionType);

        if ( exceptSockets && !Array.isArray(exceptSockets))
            exceptSockets = [exceptSockets];

        //console.log("request nodes.length", nodes.length, request, data, )
        //console.log("nodes.length", nodes.length );

        for (let i=0; i < nodes.length; i++) {

            let broadcast = true;

            if (exceptSockets && Array.isArray(exceptSockets))
                for (let j=0; j<exceptSockets.length; j++)
                    if(exceptSockets[j].node && exceptSockets[j].node.sckAddress )
                        if (nodes[i].socket.node.sckAddress.matchAddress(exceptSockets[j].node.sckAddress, {"uuid":true} )) {
                            broadcast = false;
                            break;
                        }


            if (broadcast)
                nodes[i].socket.node.sendRequest(request, data);

        }

        return true;
    }

    sendLastBlock(callback){

        if ( !Blockchain.blockchain.blocks.last ) return;

        this.node.sendRequest("head/new-block", {
            l: Blockchain.blockchain.blocks.length,
            h: Blockchain.blockchain.blocks.last.hashChain,
            s: Blockchain.blockchain.blocks.blocksStartingPoint,
            p: Blockchain.blockchain.agent.light ? ( Blockchain.blockchain.proofPi  && Blockchain.blockchain.proofPi.validatesLastBlock()) : true, // i also have the proof
            W: Blockchain.blockchain.blocks.chainWorkSerialized, // chain work
        }, callback);
    }

    async calculateLatency(){

        let maxLatency = consts.SETTINGS.PARAMS.MAX_ALLOWED_LATENCY;
        let startTime = Date.now();
        let answer = await this.node.sendRequestWaitOnce("ping", undefined, "pong", maxLatency);

        if (answer === 'r')
            this.latency = Date.now() - startTime;
        else
            this.latency = maxLatency;

    }

}

export default NodeProtocol