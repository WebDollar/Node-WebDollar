import {NodeWebPeer} from '../../web_peer/node-web-peer.js';
import {nodeProtocol, nodeFallBackInterval} from '../../../../consts/const_global.js';
import {NodeWebPeersService} from '../node-web-peers-service.js';
import {NodeWaitlist} from '../../../lists/waitlist/node-waitlist.js';

class NodePeersDiscoveryService {

    constructor(){

        console.log("NodeDiscover constructor");

    }

    startDiscovery(){

        this.askForDiscovery();

    }

    askForDiscovery(){

    }

}

exports.NodePeersDiscoveryService = new NodePeersDiscoveryService();

