import {nodeVersionCompatibility, nodeVersion} from 'consts/const_global'
import NodesList from 'node/lists/nodes-list'

class NodeProtocol {

    /*
        HELLO PROTOCOL
     */
    async sendHello (node) {

        //console.log(node);

        // Waiting for Protocol Confirmation
        let response = await node.sendRequestWaitOnce("HelloNode", {
            version: nodeVersion,
        });

        console.log("RECEIVED HELLO NODE BACK", response, typeof response);

        if ((response.hasOwnProperty("version"))&&(response.version <= nodeVersionCompatibility)){

            //check if it is a unique connection, add it to the list
            let previousConnection = NodesList.searchNodeSocketByAddress(node.sckAddress);

            // console.log("sendHello clientSockets", NodesList.clientSockets);
            // console.log("sendHello serverSockets", NodesList.serverSockets);
            // console.log("sendHello", result);

            if (previousConnection === null  || (process.env.ALLOW_DOUBLE_CONNECTIONS||'false') === 'true' ){
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


}

exports.NodeProtocol = new NodeProtocol();