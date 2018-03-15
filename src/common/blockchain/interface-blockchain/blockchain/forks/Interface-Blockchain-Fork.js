import InterfaceBlockchainBlockValidation from "../../blocks/validation/Interface-Blockchain-Block-Validation";

import global from "consts/global"
import BlockchainGenesis from 'common/blockchain/global/Blockchain-Genesis'
import StatusEvents from "common/events/Status-Events";

/**
 * Blockchain contains a chain of blocks based on Proof of Work
 */
class InterfaceBlockchainFork {


    constructor (){
    }

    /**
     * initializeConstructor is used to initialize the constructor dynamically using .apply method externally passing the arguments
     */

    initializeConstructor(blockchain, forkId, sockets, forkStartingHeight, forkChainStartingPoint, newChainLength, header){

        this.blockchain = blockchain;

        this.forkId = forkId;

        if (!Array.isArray(sockets))
            sockets = [sockets];

        this.sockets = sockets;
        this.forkStartingHeight = forkStartingHeight||0;
        this.forkStartingHeightDownloading = forkStartingHeight||0;

        this.forkChainStartingPoint = forkChainStartingPoint;
        this.forkChainLength = newChainLength||0;
        this.forkBlocks = [];
        this.forkHeader = header;

        this._blocksCopy = [];
    }

    async _validateFork(validateHashesAgain){

        let useFork = false;

        if (this.blockchain.blocks.length < this.forkStartingHeight + this.forkBlocks.length)
            useFork = true;
        else
        if (this.blockchain.blocks.length === this.forkStartingHeight + this.forkBlocks.length) //I need to check
            if (this.forkBlocks[this.forkBlocks.length-1].hash.compare( this.blockchain.getHashPrev(this.blockchain.blocks.length) ) < 0)
                useFork = true;

        if (!useFork)
            return false;

        if (validateHashesAgain)
            for (let i = 0; i < this.forkBlocks.length; i++){

                if (! (await this._validateForkBlock( this.forkBlocks[i], this.forkStartingHeight + i )))
                    throw "validateForkBlock failed for " + i;

            }

        return true;
    }

    async includeForkBlock(block, ){

        if (! (await this._validateForkBlock(block, block.height)) )
            throw "includeForkBlock failed for "+block.height;

        this.forkBlocks.push(block);

        return true;
    }

    /**
     * It Will only validate the hashes of the Fork Blocks
     */
    async _validateForkBlock(block, height ){

        //calculate the forkHeight
        let forkHeight = block.height - this.forkStartingHeight;

        if (block.height < this.forkStartingHeight)
            throw 'block height is smaller than the fork itself';
        if (block.height !== height)
            throw "block height is different than block's height";

        let result = await this.blockchain.validateBlockchainBlock( block );

        return result;
    }

    // return the difficultly target for ForkBlock
    getForkDifficultyTarget(height){

        let forkHeight = height - this.forkStartingHeight;

        if (height === 0)
            return BlockchainGenesis.difficultyTarget; // based on genesis block
        else if ( forkHeight === 0)
            return this.blockchain.getDifficultyTarget(height);
        else if ( forkHeight > 0)
            return this.forkBlocks[forkHeight - 1].difficultyTarget; // just the fork
        else
            return this.blockchain.getDifficultyTarget(height) // the blockchain
    }

    getForkTimeStamp(height){

        let forkHeight = height - this.forkStartingHeight;

        if (height === 0)
            return BlockchainGenesis.timeStamp; // based on genesis block
        else if ( forkHeight === 0)
            return this.blockchain.getTimeStamp(height); // based on previous block from blockchain
        else if ( forkHeight > 0)
            return this.forkBlocks[forkHeight - 1].timeStamp; // just the fork
        else
            return this.blockchain.getTimeStamp(height) // the blockchain

    }

    getForkPrevHash(height){
        let forkHeight = height - this.forkStartingHeight;

        if (height === 0)
            return BlockchainGenesis.hash; // based on genesis block
        else if ( forkHeight === 0)
            return this.blockchain.getHashPrev(height); // based on previous block from blockchain
        else if ( forkHeight > 0)
            return this.forkBlocks[forkHeight - 1].hash; // just the fork
        else
            return this.blockchain.getHashPrev(height) // the blockchain
    }

    _createBlockValidation_ForkValidation(height, forkHeight){

        let validationType = {};

        if (height === this.forkChainLength-1)
            validationType["validation-timestamp-adjusted-time"] = true;

        return new InterfaceBlockchainBlockValidation(this.getForkDifficultyTarget.bind(this), this.getForkTimeStamp.bind(this), this.getForkPrevHash.bind(this), validationType );
    }

    _createBlockValidation_BlockchainValidation(height, forkHeight){

        let validationType = {};

        if (height === this.forkChainLength-1)
            validationType["validation-timestamp-adjusted-time"] = true;

        return new InterfaceBlockchainBlockValidation(this.getForkDifficultyTarget.bind(this), this.getForkTimeStamp.bind(this), this.getForkPrevHash.bind(this), validationType );
    }


    /**
     * Validate the Fork and Use the fork as main blockchain
     */
    async saveFork(){

        if (global.TERMINATED)
            return false;

        //overwrite the blockchain blocks with the forkBlocks

        // It don't validate the Fork Blocks again

        console.log("save Fork before validateFork");

        if (! (await this._validateFork(false))) {
            console.error("validateFork was not passed");
            return false
        }
        console.log("save Fork after validateFork");

        // to do

        let success = await this.blockchain.semaphoreProcessing.processSempahoreCallback( async () => {

            //making a copy of the current blockchain

            try {
                this._blocksCopy = [];

                for (let i = this.forkStartingHeight; i < this.blockchain.blocks.length; i++)
                    this._blocksCopy.push(this.blockchain.blocks[i]);

            } catch (exception){
                console.error("_blockCopy raised an error");
                return false;
            }

            try {
                this.preForkClone();
            } catch (exception){
                console.error("preForkBefore raised an error");
            }

            try {
                this.preFork();
            } catch (exception){
                this.revertFork();
                console.error("preFork raised an error");
            }

            this.blockchain.blocks.spliceBlocks(this.forkStartingHeight);

            let forkedSuccessfully = true;


            console.log('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
            console.log('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
            console.log('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');


            let index;
            try {

                for (index = 0; index < this.forkBlocks.length; index++) {

                    StatusEvents.emit( "agent/status", {message: "Synchronizing - Including Block", blockHeight: this.forkBlocks[index].height, blockHeightMax: this.forkChainLength } );

                    this.forkBlocks[index].blockValidation = this._createBlockValidation_BlockchainValidation( this.forkBlocks[index].height , index);

                    if (! (await this.saveIncludeBlock(index)) ) {
                        console.error("fork couldn't be included in main Blockchain ", index);
                        forkedSuccessfully = false;
                        break;
                    }
                }

            } catch (exception){
                console.error("saveFork includeBlockchainBlock1 raised exception", exception, "index", index, "forkStartingHeight", this.forkStartingHeight, "fork", this);
                forkedSuccessfully = false;
            }

            //reverting back to the clones
            if (!forkedSuccessfully)
                await this.revertFork();

            //revert the last K blocks
            if (!forkedSuccessfully) {

                this.blockchain.blocks.spliceBlocks(this.forkStartingHeight);

                try {

                    for (let i = 0; i < this._blocksCopy.length; i++)
                        if (! (await this.blockchain.includeBlockchainBlock(this._blocksCopy[index], false, "all", false))) {
                            console.error("blockchain couldn't restored after fork included in main Blockchain ", i);
                            break;
                        }

                } catch (exception){
                    console.error("saveFork includeBlockchainBlock2 raised exception", exception);
                }

            //successfully, let's delete the backup blocks
            } else {
                for (let i = this.forkStartingHeight; i < this.blockchain.blocks.length; i++)
                    delete this._blocksCopy[i];

                this._blocksCopy = [];
            }

            await this.postFork(forkedSuccessfully);

            //propagating valid blocks
            if (forkedSuccessfully) {
                await this.blockchain.saveBlockchain();
                this.blockchain.mining.resetMining();
            }

            return forkedSuccessfully;
        });

        // it was done successfully
        console.log("FORK SOLVER SUCCESS", success);

        if (success){
            //propagate last block
            this.blockchain.propagateBlocks( this.blockchain.blocks.length-1, this.sockets );
        }

        return success;
    }

    preForkClone(){

    }

    preFork(){

    }


    revertFork(){

    }

    postFork(forkedSuccessfully){

    }


    async saveIncludeBlock(index){

        if (! (await this.blockchain.includeBlockchainBlock( this.forkBlocks[index], false, "all", false))) {
            console.error("fork couldn't be included in main Blockchain ", index);
            return false;
        }

        return true;
    }



}

export default InterfaceBlockchainFork;