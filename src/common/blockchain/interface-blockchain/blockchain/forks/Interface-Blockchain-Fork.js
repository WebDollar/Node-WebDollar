import InterfaceBlockchainBlockValidation from "../../blocks/validation/Interface-Blockchain-Block-Validation";

import global from "consts/global"
import BlockchainGenesis from 'common/blockchain/global/Blockchain-Genesis'
import StatusEvents from "common/events/Status-Events";
import RevertActions from "common/utils/Revert-Actions/Revert-Actions";

/**
 * Blockchain contains a chain of blocks based on Proof of Work
 */
class InterfaceBlockchainFork {


    constructor (){

        // setTimeout(()=>{
        //
        //     this
        //
        // }, 60*1000)

    }

    /**
     * initializeConstructor is used to initialize the constructor dynamically using .apply method externally passing the arguments
     */

    initializeConstructor(blockchain, forkId, sockets, forkStartingHeight, forkChainStartingPoint, newChainLength, headers, forkReady = false){

        this.blockchain = blockchain;

        this.forkId = forkId;

        if (!Array.isArray(sockets))
            sockets = [sockets];

        this.sockets = sockets;

        this.forkReady = false;

        this.forkIsSaving = false;
        this.forkStartingHeight = forkStartingHeight||0;
        this.forkStartingHeightDownloading = forkStartingHeight||0;

        this.forkChainStartingPoint = forkChainStartingPoint;
        this.forkChainLength = newChainLength||0;
        this.forkBlocks = [];

        if (!Array.isArray(headers)) headers = [headers];
        this.forkHeaders = headers;

        this.forkPromise = new Promise ((resolve)=>{
            this._forkPromiseResolver = resolve;
        });

        this._blocksCopy = [];
    }

    async _validateFork(validateHashesAgain){

        //forkStartingHeight is offseted by 1

        if (this.blockchain.blocks.length > this.forkStartingHeight + this.forkBlocks.length )
            throw {message: "my blockchain is larger than yours", position: this.forkStartingHeight + this.forkBlocks.length, blockchain: this.blockchain.blocks.length};
        else
        if (this.blockchain.blocks.length === this.forkStartingHeight + this.forkBlocks.length ) //I need to check
            if ( this.forkBlocks[0].hash.compare(this.blockchain.getHashPrev(this.forkStartingHeight)) <= 0)
                throw { message: "blockchain has same length, but your block is not better than mine" };

        if (validateHashesAgain)
            for (let i = 0; i < this.forkBlocks.length; i++){

                if (! (await this._validateForkBlock( this.forkBlocks[i], this.forkStartingHeight + i )))
                    throw {message:"validateForkBlock failed for ", index:i};

            }

        return true;
    }

    async includeForkBlock(block, ){

        if (! (await this._validateForkBlock(block, block.height)) )
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

        let result = await this.blockchain.validateBlockchainBlock( block );

        return result;
    }

    initializeFork(){
        this.forkReady = true;
        return true;
    }

    getForkBlock(height){

        let forkHeight = height - this.forkStartingHeight;

        if (height <= 0)
            return BlockchainGenesis; // based on genesis block
        else if ( forkHeight === 0)
            return this.blockchain.getBlock(height);
        else if ( forkHeight > 0)
            return this.forkBlocks[forkHeight - 1]; // just the fork
        else
            return this.blockchain.getBlock(height) // the blockchain
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
            return BlockchainGenesis.hashPrev; // based on genesis block
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

        return new InterfaceBlockchainBlockValidation(this.getForkBlock.bind(this), this.getForkDifficultyTarget.bind(this), this.getForkTimeStamp.bind(this), this.getForkPrevHash.bind(this), validationType );
    }

    _createBlockValidation_BlockchainValidation(height, forkHeight){

        let validationType = {};

        if (height === this.forkChainLength-1)
            validationType["validation-timestamp-adjusted-time"] = true;

        if (height !== this.forkChainLength-1)
            validationType["avoid-calculating-proofs"] = true;

        return new InterfaceBlockchainBlockValidation(this.getForkBlock.bind(this), this.getForkDifficultyTarget.bind(this), this.getForkTimeStamp.bind(this), this.getForkPrevHash.bind(this), validationType );
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

        if (! (await this._validateFork(false))) {
            console.error("validateFork was not passed");
            return false
        }

        console.log("save Fork after validateFork");


        let revertActions = new RevertActions(this.blockchain);

        let success = await this.blockchain.semaphoreProcessing.processSempahoreCallback( async () => {

            if (! (await this._validateFork(false))) {
                console.error("validateFork was not passed");
                return false
            }

            this.forkIsSaving = true;

            try {

                //making a copy of the current blockchain
                this.preForkClone();

            } catch (exception){
                console.error("preForkBefore raised an error", exception);
                this.forkIsSaving = false;
                return false;
            }

            try {

                this.preFork(revertActions);

            } catch (exception){

                console.error("preFork raised an error", exception);

                revertActions.revertOperations('', "all");
                this._blocksCopy = []; //We didn't use them so far
                await this.revertFork();

                this.forkIsSaving = false;
                return false;
            }

            this.blockchain.blocks.spliceBlocks(this.forkStartingHeight);

            let forkedSuccessfully = true;

            console.log('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
            console.log('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');

            //TODO use the revertActions to revert the process

            let index;
            try {

                for (index = 0; index < this.forkBlocks.length; index++) {

                    StatusEvents.emit( "agent/status", { message: "Synchronizing - Including Block", blockHeight: this.forkBlocks[index].height, blockHeightMax: this.forkChainLength } );

                    this.forkBlocks[index].blockValidation = this._createBlockValidation_BlockchainValidation( this.forkBlocks[index].height , index);
                    this.forkBlocks[index].blockValidation.blockValidationType['skip-validation-PoW-hash'] = true; //It already validated the hash

                    if (! (await this.saveIncludeBlock(index, revertActions)) )
                        throw({message: "fork couldn't be included in main Blockchain ", index: index});

                }

                await this.blockchain.saveBlockchain( this.forkStartingHeight );

                console.log("FORK STATUS SUCCESS5: ", forkedSuccessfully, "position", this.forkStartingHeight);


                //successfully, let's delete the backup blocks
                this._deleteBackupBlocks();

            } catch (exception){

                console.error('-----------------------------------------');
                console.error("saveFork includeBlockchainBlock1 raised exception");
                this.printException( exception );
                console.error("index", index, "forkStartingHeight", this.forkStartingHeight, "fork");
                console.error('-----------------------------------------');
                forkedSuccessfully = false;


                //revert the accountant tree
                //revert the last K block
                revertActions.revertOperations('', "all");

                //reverting back to the clones, especially light settings
                await this.revertFork();

            }

            await this.postForkTransactions(forkedSuccessfully);

            this.postFork(forkedSuccessfully);

            if (forkedSuccessfully) {
                this.blockchain.mining.resetMining();
                setTimeout( ()=>{ this._forkPromiseResolver(true) } , 10 ); //making it async
            }

            this.forkIsSaving = false;
            return forkedSuccessfully;
        });

        // it was done successfully
        console.log("FORK SOLVER SUCCESS", success);

        if (success){
            //propagate last block
            this.blockchain.propagateBlocks( this.blockchain.blocks.length-1, this.sockets );

            this.blockchain.agent.protocol.askBlockchain(this.getSocket());

        }

        return success;
    }


    preForkClone(cloneBlocks=true){

        try {

            this._blocksCopy = [];

            if (!cloneBlocks) return true;

            for (let i = this.forkStartingHeight; i < this.blockchain.blocks.length; i++)
                this._blocksCopy.push(this.blockchain.blocks[i]);

        } catch (exception){
            console.error("_blockCopy raised an error", exception);
            throw exception;
        }

        return true;
    }

    preFork(revertActions){

    }


    async revertFork(){
        try {

            for (let i=0; i<this._blocksCopy.length; i++)
                if (! (await this.blockchain.includeBlockchainBlock(this._blocksCopy[i], false, "all", false))) {

                    console.error("----------------------------------------------------------");
                    console.error("----------------------------------------------------------");
                    console.error("----------------------------------------------------------");
                    console.error("blockchain couldn't restored after fork included in main Blockchain ", i);
                    console.error("----------------------------------------------------------");
                    console.error("----------------------------------------------------------");
                    console.error("----------------------------------------------------------");

                }

        } catch (exception){
            console.error("saveFork includeBlockchainBlock2 raised exception", exception);
        }
    }

    postForkTransactions(forkedSuccessfully){

        //move the transactions to pending
        if (forkedSuccessfully) {

            // remove transactions and place them in the queue
            this._blocksCopy.forEach((block) => {
                block.data.transactions.transactions.forEach((transaction) => {

                    transaction.confirmed = false;

                    try {
                        this.blockchain.transactions.pendingQueue.includePendingTransaction(transaction, "all");
                    }
                    catch (exception) {
                        console.warn("Transaction Was Rejected to be Added to the Pending Queue ", transaction);
                    }

                });
            });

            this.forkBlocks.forEach((block)=> {
                block.data.transactions.transactions.forEach((transaction) => {
                    transaction.confirmed = true;

                    this.blockchain.transactions.pendingQueue._removePendingTransaction(transaction);

                });
            });

        } else {

            this._blocksCopy.forEach( (block) => {
                block.data.transactions.transactions.forEach((transaction) => {
                    transaction.confirmed = true;

                    this.blockchain.transactions.pendingQueue._removePendingTransaction(transaction);

                });
            });

            this.forkBlocks.forEach((block)=>{
                block.data.transactions.transactions.forEach((transaction)=>{
                    transaction.confirmed = false;

                    try {
                        this.blockchain.transactions.pendingQueue.includePendingTransaction(transaction, "all");
                    }
                    catch (exception) {
                        console.warn("Transaction Was Rejected to be Added to the Pending Queue ", transaction);
                    }

                });
            })
        }

        this.blockchain.transactions.pendingQueue.removeOldTransactions();

    }

    postFork(forkedSuccessfully){

    }

    async saveIncludeBlock(index, revertActions){

        if (! (await this.blockchain.includeBlockchainBlock( this.forkBlocks[index], false, "all", false, revertActions))) {
            console.error("fork couldn't be included in main Blockchain ", index);
            return false;
        }

        return true;
    }

    _deleteBackupBlocks(){


        for (let i = this.forkStartingHeight; i < this.blockchain.blocks.length; i++)
            delete this._blocksCopy[i];

        this._blocksCopy = [];

    }

    printException(exception){

        exception = JSON.stringify(exception);

        let isIterable = (obj) => {
            // checks for null and undefined
            if (obj === null)
                return false;
            return typeof obj[Symbol.iterator] === 'function';
        };

        let removeBlocks = (obj, depth=1000)=>{

            if (depth <= 0) return;

            if (isIterable(obj) || Array.isArray(obj) )
            for (let key in obj)
                if (obj.hasOwnProperty(key)){
                    if (key === "blocks")
                        obj[key] = '';

                    removeBlocks(obj[key], depth-1);
                }

        };

        removeBlocks(exception);
        console.error(exception);

    }

    getSocket(){
        let socket = this.sockets;
        if (Array.isArray(socket))
            socket = socket[0];

        return socket;
    }

}

export default InterfaceBlockchainFork;