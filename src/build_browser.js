import {Node} from './index.js';

console.log("BROWSER MODE");

process.env.ALLOW_DOUBLE_CONNECTIONS = true;

Node.NodeClientsService.startService();
Node.NodeWebPeersService.startService();


