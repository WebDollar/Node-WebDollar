
import NodesWaitlist from '../node/lists/waitlist/Nodes-Waitlist.js';
import NodesList from '../node/lists/Nodes-List.js';
import NodeClientsService from '../node/sockets/node-clients/service/Node-Clients-Service.js';
import NodeWebPeersService from '../node/webrtc/service/node-web-peers-service.js';
import NodesStats from '../node/lists/stats/Nodes-Stats.js';
import NodePropagationProtocol from '../common/sockets/protocol/Node-Propagation-Protocol.js';
import NodeExpress from '../node/sockets/node-server/express/Node-Express.js';
import NodeServer from '../node/sockets/node-server/sockets/Node-Server.js';


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


