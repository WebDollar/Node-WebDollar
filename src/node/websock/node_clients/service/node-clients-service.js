import {NodeClient} from '../socket/node-client.js';
import {NodeDiscoveryService} from './discovery/node-clients-discovery-service.js';
import NodesList from 'node/lists/nodes-list'
import {NodesWaitlist} from '../../../lists/waitlist/nodes-waitlist.js';


class NodeClientsService {


    constructor(){
        console.log("NodeServiceClients constructor");

    }


    startService(){
        NodeDiscoveryService.startDiscovery();
        NodesWaitlist.startConnecting();
    }




}

exports.NodeClientsService = new NodeClientsService();