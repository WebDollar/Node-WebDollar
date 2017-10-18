import {NodeServer} from './server/sockets/node-server.js';
import {NodeClientsService} from './clients/service/node-clients-service.js';
import {NodeStats} from './stats/node-stats.js';

import {NodeLists} from './lists/node-lists.js';

let nodeServer = new NodeServer(NodeLists);
let nodeClientsService = new NodeClientsService(NodeLists);

//nodeServer.setNodeClientsService(NodeClientsService);


exports.NodeServer = nodeServer;
exports.NodeClientsService = nodeClientsService;