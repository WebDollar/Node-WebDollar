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


    searchNodeByAddress(address){

        address = address.toLowerCase();

        for (let i=0; i<this.nodeClients.length; i++)
            if (this.nodeClients[i].address.toLowerCase() === address){
                return this.nodeClients[i];
            }
    }


}

exports.NodeClientsService = new NodeClientsService();