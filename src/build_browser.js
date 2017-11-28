import {NodeClientsService, NodeWebPeersService} from './index.js';

console.log("BROWSER MODE");

process.env.ALLOW_DOUBLE_CONNECTIONS = true;

NodeClientsService.startService();
NodeWebPeersService.startService();


