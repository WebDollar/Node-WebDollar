import consts from 'consts/const_global'
import NodesList from 'node/lists/nodes-list'
import NodesType from "node/lists/types/Nodes-Type"
import CONNECTION_TYPE from "../../../node/lists/types/Connections-Type";

class NodeProtocol {

    /*
        HELLO PROTOCOL
     */
    async sendHello (node, validationDoubleConnectionsTypes) {


        // Waiting for Protocol Confirmation

        console.log("sendHello");

        let response;
        for (let i=0; i< 4; i++) {

            response = await node.sendRequestWaitOnce("HelloNode", {
                version: consts.SETTINGS.NODE.VERSION,
                uuid: consts.SETTINGS.UUID,
                nodeType: process.env.BROWSER ? NodesType.NODE_WEB_PEER : NodesType.NODE_TERMINAL
            });

            if ( typeof response === "object" && response !== null && response.hasOwnProperty("uuid") )
                break;

        }

        if (typeof response !== "object" || response === null) {
            console.error("No Hello");
            return false;
        }

        if (response === null || !response.hasOwnProperty("uuid") ) {
            console.error("hello received, but there is not uuid", response);
            return false;
        }


        if (response.hasOwnProperty("version")){

            if (response.version < consts.SETTINGS.NODE.VERSION_COMPATIBILITY){
                console.log("hello received, VERSION is not right", response.version, consts.SETTINGS.NODE.VERSION_COMPATIBILITY);
                return false;
            }

            if ( [NodesType.NODE_TERMINAL, NodesType.NODE_WEB_PEER].indexOf( response.nodeType ) === -1 ){
                console.error("invalid node type", response);
                return false;
            }

            if (NodesList.countNodesByType(NodesType.NODE_TERMINAL) > consts.SETTINGS.PARAMS.CONNECTIONS.SERVER.MAXIMUM_CONNECTIONS_FROM_TERMINAL){
                node.disconnect();
                return false;
            }

            if (NodesList.countNodesByType(NodesType.NODE_WEB_PEER) > consts.SETTINGS.PARAMS.CONNECTIONS.SERVER.MAXIMUM_CONNECTIONS_FROM_BROWSER){
                node.disconnect();
                return false;
            }

            node.sckAddress.uuid = response.uuid;
            node.protocol.nodeType = response.nodeType;

            //check if it is a unique connection, add it to the list
            let previousConnection = NodesList.searchNodeSocketByAddress(node.sckAddress, "all", validationDoubleConnectionsTypes);

            if ( previousConnection === null ){
                console.log("RECEIVED HELLO NODE BACK", response.version, response.uuid);

                node.protocol.helloValidated = true;
                console.log("hello validated");
                return true;


            } else {

                if (response.nodeType === NodesType.NODE_WEB_PEER) {
                    node.protocol.helloValidated = true;
                    return true;
                } else {
                    console.log("hello not validated because double connection");
                }

            }
        }
        //delete socket;
        return false;

    }


    /**
     * boradcast to every sockets except the exceptSockets
     * @param request
     * @param data
     * @param type
     * @param exceptSockets
     */
    broadcastRequest (request, data, type, exceptSockets){

        if (exceptSockets === "all") return false;

        let nodes = NodesList.getNodes(type);

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

    }


}

export default new NodeProtocol();