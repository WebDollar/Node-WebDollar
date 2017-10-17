import {NodeServer} from './../node/server/sockets/node-server.js';
import {NodeClientsService} from './../node/clients/service/node-clients-service.js';

import {NodeLists} from './lists/node-lists.js';

let nodeServer = new NodeServer(NodeLists);
let nodeClientsService = new NodeClientsService(NodeLists);

//nodeServer.setNodeClientsService(NodeClientsService);


exports.NodeServer = nodeServer;
exports.NodeClientsService = nodeClientsService;