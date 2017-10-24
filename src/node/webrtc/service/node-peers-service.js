import {NodeWebPeer} from '../web_peer/node-web-peer.js';
import {NodePeersDiscoveryService} from './discovery/node-peers-discovery-service.js';
import {NodeLists} from '../../lists/node-lists.js';
import {NodeClientsWaitlist} from '../../lists/waitlist/node-clients-waitlist.js';


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
        NodeClientsWaitlist.startConnecting();
    }


}

exports.NodePeersService = new NodePeersService();