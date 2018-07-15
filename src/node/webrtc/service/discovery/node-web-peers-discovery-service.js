import NodesList from 'node/lists/Nodes-List'
import consts from "consts/const_global";
import CONNECTIONS_TYPE from "node/lists/types/Connection-Type"
import NODES_CONSENSUS_TYPE from "../../../lists/types/Node-Consensus-Type";

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

        //pool miner is avoiding webrtc
        if ([ NODES_CONSENSUS_TYPE.NODE_CONSENSUS_SERVER_FOR_MINER].indexOf(nodesListObject.nodeConsensusType) >= 0)
            return ;

        //client Signaling for WebRTC
        if ([ CONNECTIONS_TYPE.CONNECTION_CLIENT_SOCKET, CONNECTIONS_TYPE.CONNECTION_WEBRTC].indexOf(nodesListObject.connectionType) >= 0)
            nodesListObject.socket.node.protocol.signaling.client.initializeSignalingClientService();

    }

}

export default new NodeWebPeersDiscoveryService();

