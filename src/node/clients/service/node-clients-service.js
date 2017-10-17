import {NodeClient} from '../sockets/node-client.js';
import {NodeDiscoveryService} from './discovery/node-discovery-service.js';


class NodeClientsService {

    /*
        nodeClients = []                //list of the current nodeClients
        nodeDiscoveryService = null     //Node Discovery Service

        nodeServer = None
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
        let nodeClient = this.searchNodeClientByAddress(address);
        if (nodeClient !== null) return nodeClient;

        //

    }


    searchNodeClientByAddress(address, searchOther){

        searchOther = searchOther ||false;
        address = address.toLowerCase();

        for (let i=0; i<this.nodeClients.length; i++)
            if (this.nodeClients[i].address.toLowerCase() === address){
                return this.nodeClients[i];
            }

        //check for avoiding double connections
        if ((searchOther) && (this.nodeServer !== null))
            return this.nodeServer.searchNodeServerSocketByAddress(address, false);

        return null;
    }


}

exports.NodeClientsService = NodeClientsService;