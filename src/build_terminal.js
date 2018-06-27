import {Node, Blockchain} from './index';
import global from "consts/global";
import consts from "consts/const_global";
import termination from "./termination";


//                            light-node

Blockchain.createBlockchain("full-node", async ()=>{

    await Node.NodeExpress.startExpress();

    if (consts.DEBUG)
        await Node.NodeServer.startServer();

    Node.NodeClientsService.startService();

    Node.NodeServer.startServer();

}, ()=>{
});


process.on('SIGINT', async () => {

    await termination(Blockchain);

});
