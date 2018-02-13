import NodesWaitlist from 'node/lists/waitlist/nodes-waitlist'
import NodeDiscoveryService from 'node/sockets/node-clients/service/discovery/node-clients-discovery-service'
import NodesList from 'node/lists/nodes-list'


class NodeClientsService {


    constructor(){
        console.log("NodeClientsService constructor");

    }


    startService(){
        NodeDiscoveryService.startDiscovery();
        NodesWaitlist.startConnecting();
    }




}

export default new NodeClientsService();