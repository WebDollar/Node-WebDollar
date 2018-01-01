import NodeWebPeer from 'node/webrtc/web_peer/node-web-peer';
import consts from 'consts/const_global'
import NodeWebPeersService from 'node/webrtc/service/node-web-peers-service'
import NodesWaitlist from 'node/lists/waitlist/nodes-waitlist'
import NodesList from 'node/lists/nodes-list'

class NodeWebPeersDiscoveryService {

    constructor(){

        console.log("NodeWebPeersDiscoveryService constructor");

    }

    startDiscovery(){

        //if a new client || or || web peer is established then, I should register for accepting WebPeer connections
        NodesList.emitter.on("connected", (result) => { this.newSocketRegisterAcceptWebPeers(result) } );

    }

    newSocketRegisterAcceptWebPeers(nodesListObject){
        //{type: ["webpeer", "client"]}
        if (nodesListObject.type === "webpeer" ||   // signaling service on webpeer
            nodesListObject.type === "client") {

            let params = {};

            //client Signaling for WebRTC
            nodesListObject.socket.node.protocol.signaling.client.initializeSignalingClientService(params);

        }

    }

}

export default new NodeWebPeersDiscoveryService();

