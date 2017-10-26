import {NodeWebPeer} from '../web_peer/node-web-peer.js';
import {NodePeersDiscoveryService} from './discovery/node-peers-discovery-service.js';
import {NodeLists} from '../../lists/node-lists.js';
import {NodeWaitlist} from '../../lists/waitlist/node-waitlist.js';


class NodeWebPeersService {

    constructor(){
        console.log("NodeWebPeersService constructor");
    }

    startService(){

        NodePeersDiscoveryService.startDiscovery();
        NodeWaitlist.startConnecting();
    }


}

exports.NodeWebPeersService = new NodeWebPeersService();