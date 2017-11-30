import NodeServer from 'node/sockets/node_server/sockets/node-server';
import NodeClientsService from 'node/sockets/node_clients/service/node-clients-service'
import NodeWebPeersService from 'node/webrtc/service/node-web-peers-service'
import NodesStats from 'node/lists/stats/nodes-stats'
import NodesList from 'node/lists/nodes-list'


class Node{

    constructor(){
        this.NodeServer = NodeServer;
        this.NodeClientsService = NodeClientsService;
        this.NodeWebPeersService = NodeWebPeersService;
        this.NodesStats = NodesStats;
        this.NodesList = NodesList;
    }
}

export default new Node();


