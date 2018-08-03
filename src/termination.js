import global from "consts/global";
import NodesList from 'node/lists/Nodes-List'
import NodesWaitlist from 'node/lists/waitlist/Nodes-Waitlist'

let alreadySaved = false;


export default async (Blockchain) => {

    console.warn("SIGINT FIRED");
    global.TERMINATED = true;

    if (alreadySaved) return;
    alreadySaved = true;

    console.warn("Disconnecting All Nodes...");
    NodesList.disconnectAllNodes("all");
    NodesWaitlist.waitListFullNodes = [];
    NodesWaitlist.waitListLightNodes = [];


    console.log("Closing Express");
    try {

        let NodeExpress, NodeServer;
        if (!process.env.BROWSER) {
            NodeExpress = require('node/sockets/node-server/express/Node-Express').default;
            NodeServer = require('node/sockets/node-server/sockets/Node-Server').default;
        }

        NodeExpress.app.close();

    } catch (exception){

    }

    Blockchain.Mining.stopMining();

    try{
        await Blockchain.blockchain.transactions.pendinQueue.pendingQueueSavingManager.savePendingTransactions();
    } catch (exception){

    }

    if (!global.INTERFACE_BLOCKCHAIN_LOADING)
        await Blockchain.blockchain.saveBlockchainTerminated();

    let interval = setInterval(()=>{
        if ( global.MINIBLOCKCHAIN_LIGHT_CONFIGURATION_SAVED &&
            global.SEMAPHORE_PROCESS_DONE &&
            global.MINIBLOCKCHAIN_LIGHT_SAVED &&
            global.MINIBLOCKCHAIN_ADVANCED_SAVED &&
            global.MINIBLOCKCHAIN_SAVED &&
            global.INTERFACE_BLOCKCHAIN_SAVED &&
            global.POOL_SAVED) {

            console.log(global.MINIBLOCKCHAIN_LIGHT_CONFIGURATION_SAVED);
            console.log(global.SEMAPHORE_PROCESS_DONE);
            console.log(global.MINIBLOCKCHAIN_LIGHT_SAVED);

            console.warn("process.exit(0)");
            clearInterval(interval);

            if (!process.env.BROWSER) {


                setTimeout(()=>{

                    process.emit("SIGINT");
                    process.exit(0);

                }, 1500)

            }



        }
    }, 100)

}