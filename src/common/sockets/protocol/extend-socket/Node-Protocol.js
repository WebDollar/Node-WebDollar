import consts from 'consts/const_global'
import NodesList from 'node/lists/Nodes-List'
import NODES_TYPE from "node/lists/types/Nodes-Type"
import CONNECTION_TYPE from "node/lists/types/Connections-Type";
import Blockchain from "main-blockchain/Blockchain"

let NodeExpress, NodeServer;

if (!process.env.BROWSER) {
    NodeExpress = require('node/sockets/node-server/express/Node-Express').default;
    NodeServer = require('node/sockets/node-server/sockets/Node-Server').default;
}

class NodeProtocol {

    /*
        HELLO PROTOCOL
     */

    justSendHello(){

        return this.node.sendRequestWaitOnce("HelloNode", {
            version: consts.SETTINGS.NODE.VERSION,
            uuid: consts.SETTINGS.UUID,
            nodeType: process.env.BROWSER ? NODES_TYPE.NODE_WEB_PEER : NODES_TYPE.NODE_TERMINAL,
            domain: process.env.BROWSER ? "browser" : NodeServer.getServerHTTPAddress(),
            UTC: Blockchain.blockchain.timestamp.timeUTC,
        }, undefined, 4000);

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


        if (response.version < consts.SETTINGS.NODE.VERSION_COMPATIBILITY){
            console.log("hello received, VERSION is not right", response.version, consts.SETTINGS.NODE.VERSION_COMPATIBILITY);
            return false;
        }

        if ( [NODES_TYPE.NODE_TERMINAL, NODES_TYPE.NODE_WEB_PEER].indexOf( response.nodeType ) === -1 ){
            console.error("invalid node type", response);
            return false;
        }

        if (NODES_TYPE.NODE_TERMINAL === response.nodeType && NodesList.countNodesByType(NODES_TYPE.NODE_TERMINAL) > consts.SETTINGS.PARAMS.CONNECTIONS.BROWSER.CLIENT.MAXIMUM_CONNECTIONS_FROM_TERMINAL){
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
            else if (validationDoubleConnectionsTypes[i] === "ip" && connections.countIPs > consts.SETTINGS.PARAMS.CONNECTIONS.NO_OF_IDENTICAL_IPS  )
                return false;

        }

        console.log("RECEIVED HELLO NODE BACK", response.version);

        this.node.protocol.nodeType = response.nodeType;

        this.node.protocol.nodeDomain = response.domain;

        this.node.protocol.nodeUTC = response.UTC;
        this.node.protocol.helloValidated = true;

        return true;
    }

    async sendHello ( validationDoubleConnectionsTypes, process = true ) {


        // Waiting for Protocol Confirmation

        let response;
        for (let i=0; i < 3; i++) {

            if (this.connected === false) return false;

            response = await this.node.protocol.justSendHello();

            if ( typeof response === "object" && response !== null && response.hasOwnProperty("uuid") )
                break;

        }

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
            h: Blockchain.blockchain.blocks.last.hash,
            s: Blockchain.blockchain.blocks.blocksStartingPoint,
            p: Blockchain.blockchain.agent.light ? ( Blockchain.blockchain.proofPi !== null && Blockchain.blockchain.proofPi.validatesLastBlock() ? true : false ) : true // i also have the proof
        }, callback);
    }


}

export default NodeProtocol