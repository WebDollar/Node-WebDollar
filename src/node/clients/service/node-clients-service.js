import {NodeClient} from '../sockets/node-client.js';
import {NodeDiscoveryService} from './discovery/node-discovery-service.js';


class NodeClientsService {

    /*
        nodeClients = []                //list of the current nodeClients
        nodeDiscoveryService = null     //Node Discovery Service
    */

    constructor(){
        console.log("NodeServiceClients constructor");

        this.nodeClients = [];
        this.nodeDiscoveryService = new NodeDiscoveryService(this)
    }

    startService(){
        this.nodeDiscoveryService.startDiscovery();
    }


    connectNewNode(address){
        address = address.toLowerCase();

        //search if the new node was already connected in the past
        let nodeClient = this.searchNodeClientByAddress(address);
        if (nodeClient !== null) return nodeClient;

        //

    }


    searchNodeClientByAddress(address){

        address = address.toLowerCase();

        for (let i=0; i<this.nodeClients.length; i++)
            if (this.nodeClients[i].address.toLowerCase() === address){
                return this.nodeClients[i];
            }

        return null;
    }


}

exports.NodeClientsService = new NodeClientsService();