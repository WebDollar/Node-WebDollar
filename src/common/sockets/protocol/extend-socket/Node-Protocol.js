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

        this.node.sendRequest("HelloNode", {
            version: consts.SETTINGS.NODE.VERSION,
            uuid: consts.SETTINGS.UUID,
            nodeType: process.env.BROWSER ? NODE_TYPE.NODE_WEB_PEER : NODE_TYPE.NODE_TERMINAL,
            domain: process.env.BROWSER ? "browser" : await NodeServer.getServerHTTPAddress(),
            UTC: Blockchain.blockchain.timestamp.timeUTC,
        });

    }

    processHello( response, validationDoubleConnectionsTypes ){

        if (typeof response !== "object" || response === null || response === undefined) {
            console.error("No Hello");
            return false;
        }

        if (response.uuid === undefined || response.version === undefined) {
            console.error("hello received, but there is not uuid or version", response);
            return false;
        }


        if (response.version < Blockchain.versionCompatibility){
            console.log("hello received, VERSION is not right", response.version, Blockchain.versionCompatibility);
            return false;
        }

        if ( [NODE_TYPE.NODE_TERMINAL, NODE_TYPE.NODE_WEB_PEER].indexOf( response.nodeType ) === -1 ){
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

        for (let i=0; i<validationDoubleConnectionsTypes.length; i++){

            if (validationDoubleConnectionsTypes[i] === "uuid" && connections.countUUIDs !== 0 )
                return false;
            else if (validationDoubleConnectionsTypes[i] === "ip" && connections.countIPs > ( Blockchain.isPoolActivated ? consts.MINING_POOL.CONNECTIONS.NO_OF_IDENTICAL_IPS : consts.SETTINGS.PARAMS.CONNECTIONS.NO_OF_IDENTICAL_IPS   ))
                return false;

        }

        console.log("RECEIVED HELLO NODE BACK", response.version);

        this.node.protocol.nodeType = response.nodeType;
        this.node.protocol.nodeConsensusType = response.nodeConsensusType || NODES_CONSENSUS_TYPE.NODE_CONSENSUS_PEER;

        this.node.protocol.nodeDomain = response.domain;

        this.node.protocol.nodeUTC = response.UTC;
        this.node.protocol.helloValidated = true;

        return true;
    }

    async sendHello ( validationDoubleConnectionsTypes, process = true ) {

        // Waiting for Protocol Confirmation

        if (this.connected === false) return false;

        let response = await new Promise( (resolve)=> {

            let interval, timeout;

            this.node.once("HelloNode", (data) => {

                resolve(data);
                clearInterval(interval);
                clearTimeout(timeout)

            });

            interval = setInterval(async () => {

                this.node.protocol.justSendHello();

            }, 3000);

            this.node.protocol.justSendHello();

            timeout = setTimeout(() => {
                resolve(false);
                clearInterval(interval);
                clearTimeout(timeout)
            }, 10000);

        });

        if (!process)
            return true;

        return this.node.protocol.processHello( response, validationDoubleConnectionsTypes );

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

        if (exceptSockets !== undefined && exceptSockets !== null && !Array.isArray(exceptSockets))
            exceptSockets = [exceptSockets];

        //console.log("request nodes.length", nodes.length, request, data, )
        //console.log("nodes.length", nodes.length );

        for (let i=0; i < nodes.length; i++) {

            let broadcast = false;

            if (exceptSockets === undefined) broadcast = true;
            else
            if (Array.isArray(exceptSockets)){

                //console.log("exceptSockets", exceptSockets);

                let found = false;
                for (let j=0; j<exceptSockets.length; j++)
                    if (exceptSockets[j] !== null && nodes[i].socket.node.sckAddress.matchAddress(exceptSockets[j].node.sckAddress, ["uuid"] )) {
                        found = true;
                        break;
                    }

                if (!found)
                    broadcast = true;
            }

            if (broadcast) {
                nodes[i].socket.node.sendRequest(request, data);
            }
        }

        return true;
    }

    sendLastBlock(callback){

        if (Blockchain.blockchain.blocks.last === undefined) return;

        this.node.sendRequest("head/new-block", {
            l: Blockchain.blockchain.blocks.length,
            h: Blockchain.blockchain.blocks.last.chainHash,
            s: Blockchain.blockchain.blocks.blocksStartingPoint,
            p: Blockchain.blockchain.agent.light ? ( Blockchain.blockchain.proofPi !== undefined && Blockchain.blockchain.proofPi.validatesLastBlock() ? true : false ) : true, // i also have the proof
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