import {Node, Blockchain} from './index';
import global from "consts/global";
import consts from "consts/const_global";
import CLI from "node/menu/CLI-Menu";

console.log("TESTING MODE");

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

    console.warn("SIGINT FIRED");
    global.TERMINATED = true;

    await Blockchain.blockchain.saveBlockchainTerminated();

    setInterval(()=>{
        if ( global.MINIBLOCKCHAIN_LIGHT_CONFIGURATION_SAVED &&
             global.SEMAPHORE_PROCESS_DONE &&
             global.MINIBLOCKCHAIN_LIGHT_SAVED &&
             global.MINIBLOCKCHAIN_ADVANCED_SAVED &&
             global.MINIBLOCKCHAIN_SAVED &&
             global.INTERFACE_BLOCKCHAIN_SAVED) {

            console.log(global.MINIBLOCKCHAIN_LIGHT_CONFIGURATION_SAVED);
            console.log(global.SEMAPHORE_PROCESS_DONE);
            console.log(global.MINIBLOCKCHAIN_LIGHT_SAVED);

            console.warn("process.exit(0)");
            process.exit(0);
        }
    }, 100)

});