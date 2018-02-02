import {Node, Blockchain} from './index.js';

console.log("BROWSER MODE");

Node.NodeClientsService.startService();
Node.NodeWebPeersService.startService();

//Blockchain.createBlockchain("headers-node");
Blockchain.createBlockchain("light-node");