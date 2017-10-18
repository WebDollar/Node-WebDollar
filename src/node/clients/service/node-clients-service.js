import {NodeClient} from '../sockets/node-client.js';
import {NodeDiscoveryService} from './discovery/node-discovery-service.js';
import {NodeLists} from './../../lists/node-lists.js';
import {NodeClientsWaitlist} from '../../lists/waitlist/node-clients-waitlist.js';


class NodeClientsService {

    /*
        nodeDiscoveryService = null     //Node Discovery Service
    */

    constructor(){
        console.log("NodeServiceClients constructor");

        this.nodeClients = [];

        this.nodeServer = null;
    }

    startService(){
        NodeDiscoveryService.startDiscovery();

        this.connectNewNodeWaitlist();
    }


    async connectNewNodeWaitlist(){

        let nextNode = NodeClientsWaitlist.getFirstNodeFromWaitlist();
        if (nextNode !== null){
            await this.connectToNewNode(nextNode);
        }

        let that = this;
        setTimeout(function(){return that.connectNewNodeWaitlist() }, 3000);
    }

    async connectToNewNode(address){

        address = (address||'').toLowerCase();

        //search if the new node was already connected in the past
        let nodeClient = NodeLists.searchNodeSocketAddress(address);
        if (nodeClient !== null) return nodeClient;

        nodeClient = new NodeClient();

        await nodeClient.connectTo(address);

    }


}

exports.NodeClientsService = new NodeClientsService();