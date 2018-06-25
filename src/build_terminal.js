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

    setInterval(async function() {
        let sAddress = Blockchain.blockchain.mining.minerAddress;
        let balance = Blockchain.blockchain.accountantTree.getBalance(sAddress, undefined);
        balance = (balance === null) ? 0 : (balance / 10000);

        console.log('========================================');
        console.log('=============== BALANCE ================');
        console.log('========================================');
        console.log('');
        console.log(sAddress + ': ' + balance);
        console.log('');
        console.log('========================================');
        console.log('========================================');

    }, 10000)

}, ()=>{
});


process.on('SIGINT', function() {

    console.warn("SIGINT FIRED");
    global.TERMINATED = true;

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
