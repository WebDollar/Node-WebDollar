import {NodeClientsService, NodeWebPeersService} from './index.js';

console.log("BROWSER MODE");

NodeClientsService.startService();
NodeWebPeersService.startService();