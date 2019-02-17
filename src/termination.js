import global from "consts/global";

import NodesList from 'node/lists/Nodes-List'
import NodesWaitlist from 'node/lists/waitlist/Nodes-Waitlist'
import NodesWaitlistConnecting from 'node/lists/waitlist/Nodes-Waitlist-Connecting'

let alreadySaved = false;



export default async (Blockchain) => {

    console.warn("SIGINT FIRED");
    global.TERMINATED = true;

    if (alreadySaved) return;
    alreadySaved = true;

    Blockchain.Mining.stopMining();

    console.warn("Disconnecting All Nodes...");
    NodesList.disconnectAllNodes("all");

    NodesWaitlistConnecting.stopConnecting();
    NodesWaitlist.waitListFullNodes = [];
    NodesWaitlist.waitListLightNodes = [];

    console.log("Closing Express");
    try {

        if (!process.env.BROWSER) {
            let NodeExpress = require('node/sockets/node-server/express/Node-Express').default;
            let NodeServer = require('node/sockets/node-server/sockets/Node-Server').default;

            NodeExpress.close();
            NodeServer.close();
        }

        console.warn("Node Express and Server closed")

    } catch (exception){

    }

    Blockchain.Mining.stopMining();

    try{
        await Blockchain.blockchain.transactions.pendinQueue.pendingQueueSavingManager.savePendingTransactions();
    } catch (exception){

    }

    let interval = async ()=>{

        if ( global.MINIBLOCKCHAIN_LIGHT_CONFIGURATION_SAVED &&
            global.SEMAPHORE_PROCESS_DONE &&
            global.MINIBLOCKCHAIN_LIGHT_SAVED &&
            global.MINIBLOCKCHAIN_ADVANCED_SAVED &&
            global.INTERFACE_BLOCKCHAIN_SAVED &&
            global.POOL_SAVED ) {

            try {
                if (!global.INTERFACE_BLOCKCHAIN_LOADING)
                    await Blockchain.blockchain.saveBlockchainTerminated();
            } catch (exception){

                console.error("Exception saving", exception);

            }

            console.log(global.MINIBLOCKCHAIN_LIGHT_CONFIGURATION_SAVED);
            console.log(global.SEMAPHORE_PROCESS_DONE);
            console.log(global.MINIBLOCKCHAIN_LIGHT_SAVED);

            console.warn("process.exit(0)");

            if (!process.env.BROWSER) {


                setTimeout(()=>{

                    process.emit("SIGINT");
                    process.exit(0);

                }, 1500)

            }

            return;


        }

        setTimeout( interval, 100);
    };

    setTimeout( interval, 100);

}