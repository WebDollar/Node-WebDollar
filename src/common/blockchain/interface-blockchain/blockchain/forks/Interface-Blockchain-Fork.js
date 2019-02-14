import global from "consts/global"
import BlockchainGenesis from 'common/blockchain/global/Blockchain-Genesis'
import StatusEvents from "common/events/Status-Events";
import NodeBlockchainPropagation from "common/sockets/protocol/propagation/Node-Blockchain-Propagation";
import consts from 'consts/const_global'
import RevertActions from "common/utils/Revert-Actions/Revert-Actions";
import Blockchain from "main-blockchain/Blockchain"
import Log from 'common/utils/logging/Log';
import InterfaceBlockchainForkBasic from "./Interface-Blockchain-Fork-Basic"
import Utils from "common/utils/helpers/Utils";

/**
 * Blockchain contains a chain of blocks based on Proof of Work
 */
class InterfaceBlockchainFork extends InterfaceBlockchainForkBasic{

    async includeForkBlock(block, ){

        if ( await this._validateForkBlock(block, block.height) === false)
            throw {message: "includeForkBlock failed for ", height:block.height};

        this.forkBlocks.push(block);

        return true;
    }

    /**
     * It Will only validate the hashes of the Fork Blocks
     */
    async _validateForkBlock(block, height ){

        //calculate the forkHeight
        let forkHeight = block.height - this.forkStartingHeight;

        if (block.height < this.forkStartingHeight) throw {message: 'block height is smaller than the fork itself', blockHeight: block.height, forkStartingHeight:this.forkStartingHeight };
        if (block.height !== height) throw {message:"block height is different than block's height", blockHeight: block.height, height:height};


        //if it is a POS block, I can't validate the block
        if (BlockchainGenesis.isPoSActivated(block.height))
            block.blockValidation.blockValidationType["skip-validation-PoW-hash"] = true;

        return this.blockchain.validateBlockchainBlock( block );
    }

    async validateForkImmutability(){

        //detecting there is a fork in my blockchain
        if ( this.blockchain.blocks.blocksStartingPoint < this.blockchain.blocks.length - consts.BLOCKCHAIN.FORKS.IMMUTABILITY_LENGTH )
            if (this.forkStartingHeight <= this.blockchain.blocks.length - consts.BLOCKCHAIN.FORKS.IMMUTABILITY_LENGTH){
                //verify if there were only a few people mining in my last 30 blocks

                let addresses = [];

                for (let i=this.forkStartingHeight; i<this.blockchain.blocks.length; i++){

                    let block = await this.blockchain.getBlock(i);

                    if ( block.data.minerAddress.equals(this.blockchain.mining.unencodedMinerAddress)) continue;

                    let found = false;
                    for (let j=0; j<addresses.length; j++)
                        if (addresses[j].equals(block.data.minerAddress)){
                            found = true;
                            break;
                        }

                    if (!found)
                        addresses.push( block.data.minerAddress);

                    if (!consts.DEBUG && addresses.length >= 1)  //in my fork, there were also other miners, and not just me
                        throw {message: "Validate for Immutability failed"};
                    else
                        return true; //there were just 3 miners, probably it is my own fork...

                }

            }

        return true;

    }


    /**
     * Validate the Fork and Use the fork as main blockchain
     *
     * overwrite the blockchain blocks with the forkBlocks
     *
     */
    async saveFork(){

        if (global.TERMINATED)
            return false;

        this.forkIsSaving = true; //marking it saved because we want to avoid the forksAdministrator to delete it
        if (this.blockchain === undefined) return false; //fork was already destroyed

        if ( await this._validateFork(false, true) === false) {
            Log.error("validateFork was not passed", Log.LOG_TYPE.BLOCKCHAIN_FORKS);
            return false
        }

        Log.log("Save Fork after validateFork", Log.LOG_TYPE.BLOCKCHAIN_FORKS);


        let revertActions = new RevertActions(this.blockchain);
        revertActions.push({action: "breakpoint"});

        let success = false;

        if (this.blockchain )
            success = await this.blockchain.semaphoreProcessing.processSempahoreCallback( async () => {

                if ( await this._validateFork(false, false) === false ) {
                    Log.error("validateFork was not passed", Log.LOG_TYPE.BLOCKCHAIN_FORKS);
                    return false
                }

                if (await this.deleteAlreadyIncludedBlocks() === false){
                    Log.error("deleteAlreadyIncludedBlocks blocks no longer exist", Log.LOG_TYPE.BLOCKCHAIN_FORKS);
                    return false;
                }

                if (this.downloadBlocksSleep) await Utils.sleep(30);

                try {

                    //making a copy of the current blockchain
                    await this.preForkClone();

                } catch (exception){
                    Log.error("preForkBefore raised an error", Log.LOG_TYPE.BLOCKCHAIN_FORKS);
                    return false;
                }

                if (this.downloadBlocksSleep) await Utils.sleep(20);

                try {

                    await this.preFork(revertActions);

                } catch (exception){

                    Log.error("preFork raised an error", Log.LOG_TYPE.BLOCKCHAIN_FORKS, exception);

                    await revertActions.revertOperations('', "all");
                    this._blocksCopy = []; //We didn't use them so far

                    try {
                        await this.revertFork();
                    } catch (exception){
                        Log.error("revertFork rasied an error", Log.LOG_TYPE.BLOCKCHAIN_FORKS, exception );
                    }

                    return false;
                }

                if (this.downloadBlocksSleep) await Utils.sleep(20);

                await this.blockchain.blocks.spliceBlocks(this.forkStartingHeight, false, false);

                let forkedSuccessfully = true;

                Log.log("===========================", Log.LOG_TYPE.BLOCKCHAIN_FORKS);
                Log.log("===========================", Log.LOG_TYPE.BLOCKCHAIN_FORKS);

                //TODO use the revertActions to revert the process

                //show information about Transactions Hash
                if (consts.DEBUG) {

                    Log.log("Accountant Tree", Log.LOG_TYPE.BLOCKCHAIN_FORKS, this.blockchain.accountantTree.root.hash.toString("hex"));

                    for (let forkBlock of this.forkBlocks) {

                        for (let tx of forkBlock.data.transactions.transactions )
                            Log.log("Transaction", Log.LOG_TYPE.BLOCKCHAIN_FORKS, tx.toJSON());

                        Log.log("Transaction hash", Log.LOG_TYPE.BLOCKCHAIN_FORKS, forkBlock.data.transactions.hashTransactions.toString("hex"));
                    }

                }

                let index;
                try {

                    for (index = 0; index < this.forkBlocks.length && (!Blockchain.MinerPoolManagement || !Blockchain.MinerPoolManagement.minerPoolStarted); index++) {

                        let forkBlock = this.forkBlocks[index];

                        StatusEvents.emit( "agent/status", { message: "Synchronizing - Including Block", blockHeight: forkBlock.height, blockHeightMax: this.forkChainLength } );

                        forkBlock.blockValidation = this._createBlockValidation_BlockchainValidation( forkBlock.height , index);
                        forkBlock.blockValidation.blockValidationType['skip-validation-PoW-hash'] = true; //It already validated the hash


                        forkBlock.blockValidation.blockValidationType['skip-recalculating-hash-rate'] = true;

                        //await Blockchain.blockchain.sleep(10);

                        if (!process.env.BROWSER && (!this.downloadBlocksSleep || (index > 0 && index % 10 !== 0)))
                            forkBlock.blockValidation.blockValidationType['skip-sleep'] = true;
                        else
                            await this.blockchain.sleep(2);


                        if ( await this.saveIncludeBlock(index, revertActions, false, false) === false)
                            throw( { message: "fork couldn't be included in main Blockchain ", index: index });

                        forkBlock.socketPropagatedBy = this.socketsFirst;

                    }

                    await this.blockchain.saveBlockchain( this.forkStartingHeight );

                    Log.log("FORK STATUS SUCCESS5: "+forkedSuccessfully+ " position "+this.forkStartingHeight, Log.LOG_TYPE.BLOCKCHAIN_FORKS, );

                } catch (exception){

                    try {
                        Log.error('-----------------------------------------', Log.LOG_TYPE.BLOCKCHAIN_FORKS,);
                        Log.error("saveFork includeBlockchainBlock1 raised exception", Log.LOG_TYPE.BLOCKCHAIN_FORKS,);
                        this.printException(exception);
                        Log.error("index: " + index + "forkStartingHeight" + this.forkStartingHeight + "fork", Log.LOG_TYPE.BLOCKCHAIN_FORKS,);
                        Log.error('-----------------------------------------', Log.LOG_TYPE.BLOCKCHAIN_FORKS,);
                    } catch (exception){

                    }

                    forkedSuccessfully = false;

                    //revert the accountant tree
                    //revert the last K block

                    try {
                        await revertActions.revertOperations('', "all");
                    } catch (exception){
                        Log.error("revertOptions raised an error", Log.LOG_TYPE.BLOCKCHAIN_FORKS, exception );
                    }
                    await Utils.sleep(30);

                    try {
                        //reverting back to the clones, especially light settings
                        await this.revertFork();
                    } catch (exception){
                        Log.error("revertFork raised an error", Log.LOG_TYPE.BLOCKCHAIN_FORKS, exception );
                    }

                    await Utils.sleep(30);

                }

                await this.postForkTransactions(forkedSuccessfully);

                if (this.downloadBlocksSleep) await Utils.sleep(30);

                this.postFork(forkedSuccessfully);

                if (this.downloadAllBlocks){
                    await Utils.sleep(30);
                    Blockchain.synchronizeBlockchain();
                }

                if (forkedSuccessfully) {
                    this.blockchain.mining.resetMining();
                    this._forkPromiseResolver(true) //making it async
                }

                return forkedSuccessfully;
            });

        this.forkIsSaving = false;

        if (success) {
            StatusEvents.emit("blockchain/new-blocks", {});
            await this.blockchain.blocks.emitBlockInserted(  ) ;
        }

        // it was done successfully
        Log.info("FORK SOLVER SUCCESS: " + success, Log.LOG_TYPE.BLOCKCHAIN_FORKS);

        revertActions.destroyRevertActions();

        Blockchain.blockchain.accountantTree.emitBalancesChanges();
        Blockchain.blockchain.blocks.recalculateNetworkHashRate();
        await Blockchain.blockchain.blocks.emitBlockInserted();
        Blockchain.blockchain.blocks.emitBlockCountChanged();


        if (success) {

            try {

                //successfully, let's delete the backup blocks
                await this._deleteBackupBlocks();

                //propagate last block
                NodeBlockchainPropagation.propagateBlock( await this.blockchain.getBlock(this.blockchain.blocks.length - 1), this.sockets);

                if (this.downloadAllBlocks) {

                    await Utils.sleep(100);

                    this.blockchain.agent.protocol.askBlockchain(this.getSocket());

                }

            } catch (exception){
                Log.error("saveFork - saving the fork returned an exception", Log.LOG_TYPE.BLOCKCHAIN_FORKS, excption);
            }

        }

        return success;
    }


    async preForkClone(cloneBlocks=true){

        try {

            this._blocksCopy = [];

            if (!cloneBlocks) return true;

            for (let i = this.forkStartingHeight; i < this.blockchain.blocks.length; i++)
                this._blocksCopy.push( await this.blockchain.getBlock(i));

        } catch (exception){
            Log.error("_blockCopy raised an error", Log.LOG_TYPE.BLOCKCHAIN_FORKS, exception);
            throw exception;
        }

        return true;
    }

    preFork(revertActions){

    }

    async revertFork(){

        let index = 0;

        try {

            let revertActions = new RevertActions(this.blockchain);

            for (let i=0; i<this._blocksCopy.length; i++)
                if (! (await this.blockchain.includeBlockchainBlock( this._blocksCopy[i], false, "all", false, revertActions, false))) {

                    Log.error("----------------------------------------------------------", Log.LOG_TYPE.BLOCKCHAIN_FORKS);
                    Log.error("----------------------------------------------------------", Log.LOG_TYPE.BLOCKCHAIN_FORKS);
                    Log.error("----------------------------------------------------------", Log.LOG_TYPE.BLOCKCHAIN_FORKS);
                    Log.error("blockchain couldn't restored after fork included in main Blockchain " + i, Log.LOG_TYPE.BLOCKCHAIN_FORKS);
                    Log.error("----------------------------------------------------------", Log.LOG_TYPE.BLOCKCHAIN_FORKS);
                    Log.error("----------------------------------------------------------", Log.LOG_TYPE.BLOCKCHAIN_FORKS);
                    Log.error("----------------------------------------------------------", Log.LOG_TYPE.BLOCKCHAIN_FORKS);

                }

        } catch (exception){
            Log.error("SaveFork includeBlockchainBlock2 raised exception: " + index, Log.LOG_TYPE.BLOCKCHAIN_FORKS, exception);
        }
    }

    postForkTransactions(forkedSuccessfully){

        //move the transactions to pending
        if (forkedSuccessfully) {

            // remove transactions and place them in the queue
            for (let block of this._blocksCopy)
                block.data.transactions.unconfirmTransactions();

            for (let block of this.forkBlocks)
                block.data.transactions.confirmTransactions();

        } else {

            for (let block of this.forkBlocks)
                block.data.transactions.unconfirmTransactions();

            for (let block of this._blocksCopy)
                block.data.transactions.confirmTransactions();

        }

    }

    postFork(forkedSuccessfully){

    }


    async saveIncludeBlock(index, revertActions, saveBlock = false, showUpdate = false){

        if ( await this.blockchain.includeBlockchainBlock( this.forkBlocks[index], false, "all", saveBlock, revertActions, showUpdate) === false) {
            Log.error("fork couldn't be included in main Blockchain " + index, Log.LOG_TYPE.BLOCKCHAIN_FORKS);
            return false;
        }

        return true;
    }


    async _deleteBackupBlocks(){
        this._blocksCopy = [];
    }


}

export default InterfaceBlockchainFork;