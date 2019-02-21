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
import InterfaceBlockchainForkTests from "./tests/Interface-Blockchain-Fork-Tests"

/**
 * Blockchain contains a chain of blocks based on Proof of Work
 */
class InterfaceBlockchainFork extends InterfaceBlockchainForkBasic{

    async includeForkBlock(block, ){

        if ( await this._validateForkBlock(block, block.height) === false)
            throw {message: "includeForkBlock failed for ", height:block.height};

        this.forkBlocks.push(block);
        this.forkChainHashes[block.hash.toString("hex")] = true;

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

                let addresses = {}, addressesCount = 0;

                for (let i=this.forkStartingHeight; i<this.blockchain.blocks.length; i++){

                    let block = await this.blockchain.getBlock(i);

                    if ( block.data.minerAddress.equals(this.blockchain.mining.unencodedMinerAddress)) continue;

                    if ( !addresses[ block.data.minerAddress.toString("hex") ]){
                        addresses[block.data.minerAddress.toString("hex")] = true;
                        addressesCount++;
                    }

                    if (!consts.DEBUG && addressesCount >= 1)  //in my fork, there were also other miners, and not just me
                        throw {message: "Validate for Immutability failed"};
                    else
                        return true; //there were just 3 miners, probably it is my own fork...

                }

            }

        return true;

    }

    _showDebugInfo(){

        Log.log("Accountant Tree", Log.LOG_TYPE.BLOCKCHAIN_FORKS, this.blockchain.accountantTree.root.hash.toString("hex"));

        for (let forkBlock of this.forkBlocks) {

            for (let tx of forkBlock.data.transactions.transactions )
                Log.log("Transaction", Log.LOG_TYPE.BLOCKCHAIN_FORKS, tx.toJSON());

            Log.log("Transaction hash", Log.LOG_TYPE.BLOCKCHAIN_FORKS, forkBlock.data.transactions.hashTransactions.toString("hex"));
        }

    }



    /**
     * Validate the Fork and Use the fork as main blockchain
     *
     * overwrite the blockchain blocks with the forkBlocks
     *
     */
    async saveFork(){

        if (global.TERMINATED) return false;

        this.forkIsSaving = true; //marking it saved because we want to avoid the forksAdministrator to delete it

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

                if (global.TERMINATED) return true;

                if ( await this._validateFork(false, false) === false )
                    return Log.error("validateFork was not passed", Log.LOG_TYPE.BLOCKCHAIN_FORKS);

                if (await this.deleteAlreadyIncludedBlocks() === false)
                    return Log.error("deleteAlreadyIncludedBlocks blocks no longer exist", Log.LOG_TYPE.BLOCKCHAIN_FORKS);

                if (global.TERMINATED) return false;

                //mark the forkBlocks to avoid deletion
                for (let forkBlock of this.forkBlocks )
                    forkBlock.isForkBlock = true;

                let forkedSuccessfully = true;

                Log.log("Accountant Tree", Log.LOG_TYPE.BLOCKCHAIN_FORKS, this.blockchain.accountantTree.root.hash.toString("hex"));

                try {

                    //making a copy of the current blockchain
                    await this.preForkClone();

                    await this.preFork(revertActions);

                    let oldBlocks = await this.blockchain.blocks.spliceBlocks( this.forkStartingHeight, false, revertActions);

                    Log.log("===========================", Log.LOG_TYPE.BLOCKCHAIN_FORKS);
                    Log.log("===========================", Log.LOG_TYPE.BLOCKCHAIN_FORKS);

                    //show information about Transactions Hash
                    if (consts.DEBUG) this._showDebugInfo();

                    //InterfaceBlockchainForkTests.test1(this);
                    //InterfaceBlockchainForkTests.test2(this);
                    //InterfaceBlockchainForkTests.test3(this);

                    for (let index = 0; index < this.forkBlocks.length; index++) {

                        let forkBlock = this.forkBlocks[index];

                        StatusEvents.emit( "agent/status", { message: "Synchronizing - Including Block", blockHeight: forkBlock.height, blockHeightMax: this.forkChainLength } );

                        forkBlock.blockValidation = this._createBlockValidation_BlockchainValidation( forkBlock.height , index);

                        if ( await this.saveIncludeBlock(index, revertActions,  false) === false)
                            throw( { message: "fork couldn't be included in main Blockchain ", index: index });

                        revertActions.push( {name: "block-added", height: forkBlock.height } );

                        if (!process.env.BROWSER && (!this.downloadBlocksSleep || (index > 0 && index % 10 !== 0)))
                            forkBlock.blockValidation.blockValidationType['skip-sleep'] = true;
                        else
                            await this.blockchain.sleep(2);

                        if (forkBlock.height % 50 === 0)
                            Log.log("FORK PROCESSING: "+index, Log.LOG_TYPE.BLOCKCHAIN_FORKS, );
                    }

                    console.warn("Saving Fork. Starting from ", this.forkStartingHeight, this.blockchain.blocks.length);
                    Log.log("FORK STATUS SUCCESS5: "+forkedSuccessfully+ " position "+this.forkStartingHeight, Log.LOG_TYPE.BLOCKCHAIN_FORKS, );

                    await this.postForkTransactions(forkedSuccessfully, oldBlocks);

                    if (this.downloadBlocksSleep) await Utils.sleep(30);

                    this.postFork(forkedSuccessfully);


                } catch (exception) {

                    forkedSuccessfully = false;

                    Log.error("preFork raised an error", Log.LOG_TYPE.BLOCKCHAIN_FORKS, exception);

                    await revertActions.revertOperations('', "all");

                    //other revert settings
                    await this.revertFork();

                }

                //mark the forkBlocks to resume deletion
                for (let forkBlock of this.forkBlocks)
                    forkBlock.isForkBlock = false;

                Log.log("Accountant Tree", Log.LOG_TYPE.BLOCKCHAIN_FORKS, this.blockchain.accountantTree.root.hash.toString("hex"));

                return forkedSuccessfully;

            });

        this.forkIsSaving = false;

        if (this.downloadAllBlocks)
            Blockchain.synchronizeBlockchain();

        if (success) {
            this.blockchain.mining.resetMining();
            this._forkPromiseResolver(true); //making it async

            StatusEvents.emit("blockchain/new-blocks", {});
            await this.blockchain.blocks.emitBlockInserted(  ) ;
        }

        // it was done successfully
        Log.info("FORK SOLVER SUCCESS: " + success, Log.LOG_TYPE.BLOCKCHAIN_FORKS);

        Blockchain.blockchain.accountantTree.emitBalancesChanges();
        await Blockchain.blockchain.blocks.recalculateNetworkHashRate();
        await Blockchain.blockchain.blocks.emitBlockInserted();
        Blockchain.blockchain.blocks.emitBlockCountChanged();


        if (success) {

            try {

                //propagate last block
                NodeBlockchainPropagation.propagateBlock( await this.blockchain.blocks.last, this.sockets);

                if (this.downloadAllBlocks) {

                    await Utils.sleep(100);

                    this.blockchain.agent.protocol.askBlockchain(this.getSocket());

                }

            } catch (exception){
                Log.error("saveFork - saving the fork returned an exception", Log.LOG_TYPE.BLOCKCHAIN_FORKS, exception);
            }

        }

        return success;
    }

    preFork(revertActions){

    }

    async postForkTransactions(forkedSuccessfully, oldBlocks){

        //move the transactions to pending
        if (forkedSuccessfully) {

            // remove transactions and place them in the queue
            for (let block of oldBlocks)
                await block.data.transactions.unconfirmTransactions();

            for (let block of this.forkBlocks)
                await block.data.transactions.confirmTransactions(block.height);

        } else {

            for (let block of this.forkBlocks)
                await block.data.transactions.unconfirmTransactions();

            for (let block of oldBlocks)
                await block.data.transactions.confirmTransactions(block.height);

        }

    }

    postFork(forkedSuccessfully){

    }

    preForkClone(){

    }

    revertFork(){

    }

    async saveIncludeBlock(index, revertActions,  showUpdate = false){

        if ( await this.blockchain.includeBlockchainBlock( this.forkBlocks[index], false, "all", true, revertActions, showUpdate) === false) {
            Log.error("fork couldn't be included in main Blockchain " + index, Log.LOG_TYPE.BLOCKCHAIN_FORKS);
            return false;
        }

        return true;
    }



}

export default InterfaceBlockchainFork;