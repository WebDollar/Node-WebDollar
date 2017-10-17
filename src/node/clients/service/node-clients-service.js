import {NodeClient} from '../sockets/node-client.js';
import {NodeDiscoveryService} from './discovery/node-discovery-service.js';


class NodeClientsService {

    //nodeClients = []
    //nodeDiscoveryService = null

    constructor(){
        console.log("NodeServiceClients constructor");

        this.nodeClients = [];
        this.nodeDiscoveryService = new NodeDiscoveryService(this)
    }

    startService(){

        this.nodeDiscoveryService.startDiscovery();

    }



}

exports.serviceClients = new NodeClientsService();