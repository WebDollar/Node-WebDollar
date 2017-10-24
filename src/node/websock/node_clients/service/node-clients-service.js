import {NodeClient} from '../socket/node-client.js';
import {NodeDiscoveryService} from './discovery/node-clients-discovery-service.js';
import {NodeLists} from '../../../lists/node-lists.js';
import {NodeClientsWaitlist} from '../../../lists/waitlist/node-clients-waitlist.js';


class NodeClientsService {


    constructor(){
        console.log("NodeServiceClients constructor");
    }

    startService(){
        NodeDiscoveryService.startDiscovery();
        NodeClientsWaitlist.startConnecting();

    }




}

exports.NodeClientsService = new NodeClientsService();