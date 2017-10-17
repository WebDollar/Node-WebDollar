import {NodeServer} from './../node/server/sockets/node-server.js';
import {NodeClientsService} from './../node/clients/service/node-clients-service.js';

let nodeServer = new NodeServer();
let nodeClientsService = new NodeClientsService();

nodeServer.setNodeClientsService(NodeClientsService);


exports.NodeServer = nodeServer;
exports.NodeClientsService = nodeClientsService;