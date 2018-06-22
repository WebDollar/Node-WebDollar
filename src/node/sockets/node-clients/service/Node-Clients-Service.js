import NodesWaitlist from 'node/lists/waitlist/Nodes-Waitlist'
import NodesWaitlistConnecting from 'node/lists/waitlist/Nodes-Waitlist-Connecting'
import NodeDiscoveryService from 'node/sockets/node-clients/service/discovery/node-clients-discovery-service'
import NodesList from 'node/lists/Nodes-List'


class NodeClientsService {


    constructor(){
        console.log("NodeClientsService constructor");

    }


    startService(){
        NodesWaitlist.initializeWaitlist();
        NodeDiscoveryService.startDiscovery();
        NodesWaitlistConnecting.startConnecting();
    }




}

export default new NodeClientsService();