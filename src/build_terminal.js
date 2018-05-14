import {Node, Blockchain} from './index';
import global from "consts/global";
import consts from "consts/const_global";
import CLI from "node/menu/CLI-Menu";

console.log("TESTING MODE");

//                            light-node

Blockchain.createBlockchain("full-node", async ()=>{

    await Node.NodeExpress.startExpress();

    Node.NodeClientsService.startService();

    if (consts.DEBUG)
        Node.NodeServer.startServer();

}, ()=>{
    Node.NodeServer.startServer();
});


process.on('SIGINT', function() {

    console.warn("SIGINT FIRED");
    global.TERMINATED = true;

    setInterval(()=>{
        if ( global.MINIBLOCKCHAIN_LIGHT_CONFIGURATION_SAVED &&
             global.SEMAPHORE_PROCESS_DONE &&
             global.MINIBLOCKCHAIN_LIGHT_SAVED) {

            console.log(global.MINIBLOCKCHAIN_LIGHT_CONFIGURATION_SAVED);
            console.log(global.SEMAPHORE_PROCESS_DONE);
            console.log(global.MINIBLOCKCHAIN_LIGHT_SAVED);

            console.warn("process.exit(0)");
            process.exit(0);
        }
    })

});