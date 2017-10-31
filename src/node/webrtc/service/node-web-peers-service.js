import {NodeWebPeer} from '../web_peer/node-web-peer.js';
import {NodeWebPeersDiscoveryService} from './discovery/node-web-peers-discovery-service.js';
import {NodesList} from '../../lists/nodes-list.js';
import {NodesWaitlist} from '../../lists/waitlist/nodes-waitlist.js';


class NodeWebPeersService {

    constructor(){
        console.log("NodeWebPeersService constructor");
    }


    startService(){

        NodeWebPeersDiscoveryService.startDiscovery();
        NodesWaitlist.startConnecting();
    }


}

exports.NodeWebPeersService = new NodeWebPeersService();