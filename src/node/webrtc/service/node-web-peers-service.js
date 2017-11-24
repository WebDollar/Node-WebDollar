import NodeWebPeer from 'node/webrtc/web_peer/node-web-peer'
import NodeWebPeersDiscoveryService from 'node/webrtc/service/discovery/node-web-peers-discovery-service'
import NodesList from 'node/lists/nodes-list'
import NodesWaitlist from 'node/lists/waitlist/nodes-waitlist'


class NodeWebPeersService {

    constructor(){
        console.log("NodeWebPeersService constructor");
    }


    startService(){

        NodeWebPeersDiscoveryService.startDiscovery();
        NodesWaitlist.startConnecting();
    }


}

export default new NodeWebPeersService();