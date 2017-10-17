import {NodeClient} from '../sockets/node-client.js';
import {NodeDiscoveryService} from './discovery/node-discovery-service.js';
import {NodeLists} from './../../lists/node-lists.js';


class NodeClientsService {

    /*
        nodeDiscoveryService = null     //Node Discovery Service
    */

    constructor(){
        console.log("NodeServiceClients constructor");

        this.nodeClients = [];
        this.nodeDiscoveryService = new NodeDiscoveryService(this);

        this.nodeServer = null;
    }

    startService(){
        this.nodeDiscoveryService.startDiscovery();
    }


    connectNewNode(address){
        address = address.toLowerCase();

        //search if the new node was already connected in the past
        let nodeClient = NodeLists.searchNodeSocketAddress(address);
        if (nodeClient !== null) return nodeClient;

        nodeClient = new NodeClient(address);

    }


}

exports.NodeClientsService = NodeClientsService;