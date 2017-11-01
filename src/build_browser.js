import {NodeClientsService, NodeWebPeersService} from './index.js';
import {testWebPeer, testNodeWebPeer} from './node/webrtc/web_peer/test-node-web-peer';

console.log("BROWSER MODE");

NodeClientsService.startService();
NodeWebPeersService.startService();

//testWebPeer();
//testNodeWebPeer();