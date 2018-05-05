var NodeServer, NodeExpress;


import NodesWaitlist from 'node/lists/waitlist/nodes-waitlist'
import NodesList from 'node/lists/nodes-list'
import NodeClientsService from 'node/sockets/node-clients/service/node-clients-service'
import NodeWebPeersService from 'node/webrtc/service/node-web-peers-service'
import NodesStats from 'node/lists/stats/nodes-stats'
import NodePropagationProtocol from 'common/sockets/protocol/node-propagation-protocol'

if (!process.env.BROWSER) {
    NodeExpress = require('node/sockets/node-server/express/Node-Express').default;
    NodeServer = require('node/sockets/node-server/sockets/Node-Server').default;
}


class Node{


    constructor() {

        this.NodesList = NodesList;
        this.NodesWaitlist = NodesWaitlist;

        NodePropagationProtocol.initializePropagationProtocol();

        this.NodeExpress = NodeExpress;
        this.NodeServer = NodeServer;

        this.NodeClientsService = NodeClientsService;
        this.NodeWebPeersService = NodeWebPeersService;
        this.NodesStats = NodesStats;

    }
}

export default new Node();


