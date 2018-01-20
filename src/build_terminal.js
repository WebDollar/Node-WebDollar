import {Node, Blockchain} from './index.js';

console.log("TESTING MODE");


Node.NodeServer.startServer();
Node.NodeClientsService.startService();

Blockchain.createBlockchain("full-node");