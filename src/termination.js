import global from "consts/global";

let alreadySaved = false;

export default async (Blockchain) => {

    console.warn("SIGINT FIRED");
    global.TERMINATED = true;

    if (alreadySaved) return;
    alreadySaved = true;

    if (!global.INTERFACE_BLOCKCHAIN_LOADING)
        await Blockchain.blockchain.saveBlockchainTerminated();

    let interval = setInterval(()=>{
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
            clearInterval(interval);

            if (!process.env.BROWSER) {
                process.emit("SIGINT");
                process.exit(0);
            }

        }
    }, 100)

}