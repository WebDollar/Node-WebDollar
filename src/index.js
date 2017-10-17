console.log("Node WebDollar");


import {NodeServer} from './node/server/sockets/node-server.js';
import {NodeClientsService} from './node/clients/service/node-clients-service.js';

exports.NodeServer = NodeServer;
exports.NodeClientsService = NodeClientsService;

exports.helloWord = function() {
    console.log("This is a message from the demo package");
};


console.log("Node WebDollar End");