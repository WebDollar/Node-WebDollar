import NodesList from 'node/lists/nodes-list'
import consts from "consts/const_global";

class NodeWebPeersDiscoveryService {

    constructor() {

        console.log("NodeWebPeersDiscoveryService constructor");

    }

    startDiscovery(){

        //if a new client || or || web peer is established then, I should register for accepting WebPeer connections
        NodesList.emitter.on("nodes-list/connected", (result) => { this._newSocketRegisterAcceptWebPeers(result) } );

    }

    _newSocketRegisterAcceptWebPeers(nodesListObject){
        //{type: ["webpeer", "client"]}

        if (nodesListObject.type === "webpeer" ||   // signaling service on webpeer
            nodesListObject.type === "client") {

            let params = {
                connections: consts.SETTINGS.PARAMS.CONNECTIONS.WEBRTC.MAXIMUM_CONNECTIONS - NodesList.countNodes("webpeer"),
            }

            //client Signaling for WebRTC
            //nodesListObject.socket.node.protocol.signaling.client.initializeSignalingClientService(params);

        }

    }

}

export default new NodeWebPeersDiscoveryService();

