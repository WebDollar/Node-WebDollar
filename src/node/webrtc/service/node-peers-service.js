import {NodeWebPeer} from '../web_peer/node-web-peer.js';
import {NodePeersDiscoveryService} from './discovery/node-peers-discovery-service.js';
import {NodeLists} from '../../lists/node-lists.js';
import {NodeWaitlist} from '../../lists/waitlist/node-waitlist.js';


class NodePeersService {

    /*
        this.nodePeers = []
    */

    constructor(){
        console.log("NodePeersService constructor");

        this.nodePeers = [];
    }

    startService(){

        NodePeersDiscoveryService.startDiscovery();
        NodeWaitlist.startConnecting();
    }


}

exports.NodePeersService = new NodePeersService();