import {Node, Blockchain} from './index.js';

console.log("TESTING MODE");


Node.NodeServer.startServer();
Node.NodeClientsService.startService();


if (process.env.START_MINING){
    Blockchain.Mining.startMining();
}