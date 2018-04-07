var NodeServer, NodeExpress;

if (!process.env.BROWSER) {
    NodeExpress = require('node/sockets/node-server/express/Node-Express').default;
    NodeServer = require('node/sockets/node-server/sockets/Node-Server').default;
}

import NodesWaitlist from 'node/lists/waitlist/nodes-waitlist'
import NodeClientsService from 'node/sockets/node-clients/service/node-clients-service'
import NodeWebPeersService from 'node/webrtc/service/node-web-peers-service'
import NodesStats from 'node/lists/stats/nodes-stats'
import NodesList from 'node/lists/nodes-list'


class Node{


    constructor() {
        this.NodeExpress = NodeExpress;
        this.NodeServer = NodeServer;

        this.NodeClientsService = NodeClientsService;
        this.NodeWebPeersService = NodeWebPeersService;
        this.NodesStats = NodesStats;

        this.NodesList = NodesList;
        this.NodesWaitlist = NodesWaitlist;
    }
}

export default new Node();


