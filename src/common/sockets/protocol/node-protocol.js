const colors = require('colors/safe');
import consts from 'consts/const_global'
import NodesList from 'node/lists/nodes-list'

class NodeProtocol {

    /*
        HELLO PROTOCOL
     */
    async sendHello (node, validationDoubleConnectionsTypes) {

        //console.log(node);

        // Waiting for Protocol Confirmation
        let response = await node.sendRequestWaitOnce("HelloNode", {
            version: consts.NODE_VERSION,
            uuid: consts.UUID,
        });

        if (typeof response !== "object")
            return false;

        console.log("RECEIVED HELLO NODE BACK", response.version, response.uuid);

        if (response === null || !response.hasOwnProperty("uuid")){
            console.log(colors.red("hello received, but there is not uuid"), response);
            return false;
        }

        if (response.hasOwnProperty("version")){

            if (response.version < consts.NODE_VERSION_COMPATIBILITY){

                console.log(colors.red("hello received, VERSION is not right"), response.version);
                return false;

            }

            node.sckAddress.uuid = response.uuid;

            //check if it is a unique connection, add it to the list
            let previousConnection = NodesList.searchNodeSocketByAddress(node.sckAddress, "all", validationDoubleConnectionsTypes);

            // console.log("sendHello clientSockets", NodesList.clientSockets);
            // console.log("sendHello serverSockets", NodesList.serverSockets);
            // console.log("sendHello", result);

            if ( previousConnection === null ){
                node.protocol.helloValidated = true;
                console.log("hello validated");
                return true;
            } else {
                console.log("hello not validated because double connection");
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

        console.log("nodes.length", nodes.length );

        for (let i=0; i < nodes.length; i++) {

            let broadcast = false;

            if (exceptSockets === undefined) broadcast = true;
            else
            if (Array.isArray(exceptSockets)){

                //console.log("exceptSockets", exceptSockets);

                let found = false;
                for (let j=0; j<exceptSockets.length; j++)
                    if (exceptSockets[j] !== null && nodes[i].socket.node.sckAddress.matchAddress(exceptSockets[j].node.sckAddress)) {
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