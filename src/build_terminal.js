import {Node, Blockchain} from './index.js';

console.log("TESTING MODE");


Node.NodeServer.startServer();
Node.NodeClientsService.startService();


Blockchain.createBlockchain("full-node");

//it doesn't work
// Blockchain.createBlockchain("full-node").then((answer)=>{
//
//     if (process.env.START_TESTING === "true"){
//
//         // Instantiate a Mocha instance.
//         var mocha = new Mocha({
//             ui: 'tdd',
//             reporter: 'list'
//         });
//
//         mocha.run(() => {
//
//             require('./tests/main.test')
//
//         });
//
//     }
//
// })