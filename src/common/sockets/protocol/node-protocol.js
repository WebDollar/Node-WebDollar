import {nodeVersionCompatibility, nodeVersion} from '../../../consts/const_global.js';
import {NodesList} from '../../../node/lists/nodes-list.js';

class NodeProtocol {

    async sendHello (node) {

        // Waiting for Protocol Confirmation

        //console.log(node);

        let response = await node.sendRequestWaitOnce("HelloNode", {
            version: nodeVersion,
        });

        console.log("RECEIVED HELLO NODE BACK", response, typeof response);

        if ((response.hasOwnProperty("version"))&&(response.version <= nodeVersionCompatibility)){

            //check if it is a unique connection, add it to the list
            let result = NodesList.searchNodeSocketByAddress(node.sckAddress);

            // console.log("sendHello clientSockets", NodesList.clientSockets);
            // console.log("sendHello serverSockets", NodesList.serverSockets);
            // console.log("sendHello", result);

            if (result === null){
                node.protocol.helloValidated = true;
                console.log("hello validated");
                return true;
            }
        }
        //delete socket;
        return false;

    }


}

exports.NodeProtocol = new NodeProtocol();