import NodesList from 'node/lists/nodes-list'
import consts from "consts/const_global";
import CONNECTIONS_TYPE from "node/lists/types/Connections-Type"

class NodeWebPeersDiscoveryService {

    constructor() {

        console.log("NodeWebPeersDiscoveryService constructor");

    }

    startDiscovery(){

        //if a new client || or || web peer is established then, I should register for accepting WebPeer connections
        NodesList.emitter.on("nodes-list/connected", (result) => { this._newSocketRegisterAcceptWebPeers(result) } );

        for (let i=0; i<NodesList.nodes.length; i++)
            this._newSocketRegisterAcceptWebPeers(NodesList.nodes[i]);

    }

    _newSocketRegisterAcceptWebPeers(nodesListObject){
        //{type: ["webpeer", "client"]}


        if ([ CONNECTIONS_TYPE.CONNECTION_CLIENT_SOCKET, CONNECTIONS_TYPE.CONNECTION_WEBRTC].indexOf(nodesListObject.connectionType) >= 0) {

            //client Signaling for WebRTC

            nodesListObject.socket.node.protocol.signaling.client.initializeSignalingClientService();

        }

    }

}

export default new NodeWebPeersDiscoveryService();

