import {NodeWebPeer} from '../../web_peer/node-web-peer.js';
import {nodeProtocol, nodeFallBackInterval} from '../../../../consts/const_global.js';
import {NodeWebPeersService} from '../node-web-peers-service.js';
import {NodesWaitlist} from '../../../lists/waitlist/nodes-waitlist.js';
import {NodesList} from '../../../lists/nodes-list';

class NodeWebPeersDiscoveryService {

    constructor(){

        console.log("NodeDiscover constructor");

    }

    startDiscovery(){

        //if a new client || or || webpeer is established then, I should register for accepting WebPeer connections
        NodesList.registerEvent("connected", {type: []}, this.newSocketRegisterAcceptingWebPeers);

    }

    newSocketRegisterAcceptingWebPeers(err, nodesListObject){

        if (nodesListObject.type === "webpeer" || nodesListObject.type === "client")
            nodesListObject.socket.node.sendRequest("signals/register-web-peer-for-accepting-connections", {});

    }

}

exports.NodeWebPeersDiscoveryService = new NodeWebPeersDiscoveryService();

