import NodeClient from 'node/websock/node_clients/socket/node-client'
import NodeDiscoveryService from 'node/websock/node_clients/service/discovery/node-clients-discovery-service'
import NodesList from 'node/lists/nodes-list'
import NodesWaitlist from 'node/lists/waitlist/nodes-waitlist'


class NodeClientsService {


    constructor(){
        console.log("NodeServiceClients constructor");

    }


    startService(){
        NodeDiscoveryService.startDiscovery();
        NodesWaitlist.startConnecting();
    }




}

export default new NodeClientsService();