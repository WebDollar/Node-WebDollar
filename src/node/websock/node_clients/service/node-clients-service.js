import {NodeClient} from '../socket/node-client.js';
import {NodeDiscoveryService} from './discovery/node-clients-discovery-service.js';
import {NodeLists} from '../../../lists/node-lists.js';
import {NodeWaitlist} from '../../../lists/waitlist/node-waitlist.js';


class NodeClientsService {


    constructor(){
        console.log("NodeServiceClients constructor");
    }

    startService(){
        NodeDiscoveryService.startDiscovery();
        NodeWaitlist.startConnecting();
    }




}

exports.NodeClientsService = new NodeClientsService();