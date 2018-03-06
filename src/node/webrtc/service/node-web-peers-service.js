import NodeWebPeersDiscoveryService from 'node/webrtc/service/discovery/node-web-peers-discovery-service'



class NodeWebPeersService {

    constructor(){
        console.log("NodeWebPeersService constructor");
    }


    startService(){
        NodeWebPeersDiscoveryService.startDiscovery();
    }


}

export default new NodeWebPeersService();