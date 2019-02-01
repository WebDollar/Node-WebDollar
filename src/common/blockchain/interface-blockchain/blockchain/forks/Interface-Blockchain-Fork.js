var BigInteger = require('big-integer');
import InterfaceBlockchainBlockValidation from "../../blocks/validation/Interface-Blockchain-Block-Validation";

import global from "consts/global"
import BlockchainGenesis from 'common/blockchain/global/Blockchain-Genesis'
import StatusEvents from "common/events/Status-Events";
import RevertActions from "common/utils/Revert-Actions/Revert-Actions";
import NodeBlockchainPropagation from "common/sockets/protocol/propagation/Node-Blockchain-Propagation";
import consts from 'consts/const_global'
import MiniBlockchainAccountantTree from "../../../mini-blockchain/state/Mini-Blockchain-Accountant-Tree";
import RevertActions from "common/utils/Revert-Actions/Revert-Actions";
import Blockchain from "main-blockchain/Blockchain"
import Log from 'common/utils/logging/Log';

/**
 * Blockchain contains a chain of blocks based on Proof of Work
 */
class InterfaceBlockchainFork {


    constructor (){

        this._blocksCopy = [];
        this.forkIsSaving = false;

        this.downloadBlocksSleep = false;
        this.downloadAllBlocks = false;

    }

    destroyFork(){

        try {

            for (let i = 0; i < this.forkBlocks.length; i++)
                if (this.forkBlocks[i] !== undefined && this.forkBlocks[i] !== null && this.blockchain.blocks[this.forkBlocks[i].height] !== this.forkBlocks[i]) {

                    this.forkBlocks[i].destroyBlock();

                    this.forkBlocks[i] = undefined;
                }

            this.blockchain = undefined;

            this.forkBlocks = [];
            this.headers = [];
            this.sockets = [];
            this.forkPromise = [];
            this._blocksCopy = [];
            this._forkPromiseResolver = undefined;
            this.forkPromise = undefined;

        } catch (exception){
            Log.error("destroy fork raised an exception", Log.LOG_TYPE.BLOCKCHAIN_FORKS,  exception);
        }

    }

    /**
     * initializeConstructor is used to initialize the constructor dynamically using .apply method externally passing the arguments
     */

    initializeConstructor(blockchain, forkId, sockets, forkStartingHeight, forkChainStartingPoint, forkChainLength, forkChainWork, headers, forkReady = false){

        this.blockchain = blockchain;

        this.forkId = forkId;

        if (!Array.isArray(sockets))
            sockets = [sockets];

        this.socketsFirst = sockets[0];
        this.sockets = sockets;

        this.forkReady = false;

        this.forkStartingHeight = forkStartingHeight||0;
        this.forkStartingHeightDownloading = forkStartingHeight||0;

        this.forkChainStartingPoint = forkChainStartingPoint;
        this.forkChainLength = forkChainLength||0;
        this.forkBlocks = [];
        this.forkChainWork = forkChainWork;

        if (!Array.isArray(headers)) headers = [headers];
        this.forkHeaders = headers;

        this.forkPromise = new Promise ((resolve)=>{
            this._forkPromiseResolver = resolve;
        });

        this._blocksCopy = [];
    }




    async _validateFork(validateHashesAgain, firstValidation){

        //forkStartingHeight is offseted by 1

        if (this.forkBlocks.length === 0) throw {message: "Fork doesn't have any block"};

        if (validateHashesAgain)
            for (let i = 0; i < this.forkBlocks.length; i++){

                if (! (await this._validateForkBlock( this.forkBlocks[i], this.forkStartingHeight + i )))
                    throw {message:"validateForkBlock failed for ", index:i};

            }

        this._validateChainWork();

        return true;
    }

    validateForkImmutability(){

        //detecting there is a fork in my blockchain
        if ( this.blockchain.blocks.blocksStartingPoint < this.blockchain.blocks.length - consts.BLOCKCHAIN.FORKS.IMMUTABILITY_LENGTH )
            if (this.forkStartingHeight <= this.blockchain.blocks.length - consts.BLOCKCHAIN.FORKS.IMMUTABILITY_LENGTH){
                //verify if there were only a few people mining in my last 30 blocks

                let addresses = [];

                for (let i=this.forkStartingHeight; i<this.blockchain.blocks.length; i++){

                    if (this.blockchain.blocks[i].data.minerAddress.equals(this.blockchain.mining.unencodedMinerAddress)) continue;

                    let found = false;
                    for (let j=0; j<addresses.length; j++)
                        if (addresses[j].equals(this.blockchain.blocks[i].data.minerAddress)){
                            found = true;
                            break;
                        }

                    if (!found)
                        addresses.push(this.blockchain.blocks[i].data.minerAddress);

                    if (!consts.DEBUG && addresses.length >= 1)  //in my fork, there were also other miners, and not just me
                        throw {message: "Validate for Immutability failed"};
                    else
                        return true; //there were just 3 miners, probably it is my own fork...

                }

            }

        return true;

    }

    _validateChainWork(){

        let chainWork = new BigInteger(0);
        for (let i = this.forkStartingHeight; i<this.blockchain.blocks.length; i++)
            chainWork = chainWork.plus( this.blockchain.blocks[i].workDone );

        let forkWork = new BigInteger(0);
        for (let i=0; i< this.forkBlocks.length; i++ )
            forkWork = forkWork.plus( this.forkBlocks[i].workDone );

        let factor = 1;

        if ( forkWork.lesser( chainWork.multiply(factor) ) )
            throw {message: "forkWork is less than chainWork", forkWork: forkWork.toString(), chainWork: chainWork.toString() };

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


        //if it is a POS block, I can't validate the block
        if (BlockchainGenesis.isPoSActivated(block.height))
            block.blockValidation.blockValidationType["skip-validation-PoW-hash"] = true;

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

        if ( forkHeight === 0) return this.blockchain.getBlock(height);

        if ( forkHeight > 0) return this.forkBlocks[forkHeight - 1]; // just the fork
        return this.blockchain.getBlock(height) // the blockchain

    }

    // return the difficultly target for ForkBlock
    getForkDifficultyTarget(height, POSRecalculation = true){


        let forkHeight = height - this.forkStartingHeight;

        if (height === 0) return BlockchainGenesis.difficultyTarget; // based on genesis block
        if (height === consts.BLOCKCHAIN.HARD_FORKS.POS_ACTIVATION) return BlockchainGenesis.difficultyTargetPOS;

        if ( forkHeight === 0)
            return this.blockchain.getDifficultyTarget(height);

        let heightPrePOS = height;
        if (height >= consts.BLOCKCHAIN.HARD_FORKS.POS_ACTIVATION) {

            //calculating the virtualization of the POS
            if (height % 30 === 0) height = height - 10;  //first POS, get the last proof of Stake
            else if (height % 30 === 20) height = height - 20; //first POW, get the last proof of Work

            forkHeight = height - this.forkStartingHeight;
        }


        if ( forkHeight > 0) {

            if ( forkHeight - 1 >= this.forkBlocks.length )
                throw { message: "getForkDifficultyTarget FAILED: "+  forkHeight };

            return this.forkBlocks[forkHeight - 1].difficultyTarget; // just the fork
        }

        return this.blockchain.getDifficultyTarget(heightPrePOS, POSRecalculation) // the blockchain

    }

    getForkTimeStamp(height){

        let forkHeight = height - this.forkStartingHeight;

        if (height === 0) return BlockchainGenesis.timeStamp; // based on genesis block

        if ( forkHeight === 0) return this.blockchain.getTimeStamp(height); // based on previous block from blockchain
        if ( forkHeight > 0) return this.forkBlocks[forkHeight - 1].timeStamp; // just the fork

        return this.blockchain.getTimeStamp(height) // the blockchain

    }

    getForkPrevHash(height){
        let forkHeight = height - this.forkStartingHeight;

        if (height === 0) return BlockchainGenesis.hashPrev; // based on genesis block

        if ( forkHeight === 0) return this.blockchain.getHashPrev(height); // based on previous block from blockchain
        if ( forkHeight > 0) return this.forkBlocks[forkHeight - 1].hash; // just the fork

        return this.blockchain.getHashPrev(height) // the blockchain
    }

    getForkChainHash(height){

        let forkHeight = height - this.forkStartingHeight;

        if (height === 0) return BlockchainGenesis.hashPrev;

        if ( forkHeight === 0) return this.blockchain.getChainHashCallback(height);
        if (forkHeight > 0) return this.forkBlocks[forkHeight - 1].hashChain;

        return this.blockchain.getChainHash(height);

    }

    _createBlockValidation_ForkValidation(height, forkHeight){

        let validationType = {};

        return new InterfaceBlockchainBlockValidation(this.getForkBlock.bind(this), this.getForkDifficultyTarget.bind(this), this.getForkTimeStamp.bind(this), this.getForkPrevHash.bind(this), this.getForkChainHash.bind(this), validationType );
    }

    _createBlockValidation_BlockchainValidation(height, forkHeight){

        let validationType = {};

        if (height !== this.forkChainLength-1)
            validationType["skip-calculating-proofs"] = true;

        return new InterfaceBlockchainBlockValidation(this.getForkBlock.bind(this), this.getForkDifficultyTarget.bind(this), this.getForkTimeStamp.bind(this), this.getForkPrevHash.bind(this), this.getForkChainHash.bind(this), validationType );
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    deleteAlreadyIncludedBlocks(){

        //verify if now, I have some blocks already in my the blockchain that are similar with the fork
        let pos = -1;
        for (let i=0; i<this.forkBlocks.length-1; i++)
            if ( this.blockchain.blocks[ this.forkBlocks[i].height ] && this.blockchain.blocks[ this.forkBlocks[i].height ].calculateNewChainHash().equals(this.forkBlocks[i].calculateNewChainHash() )  ){

                pos = i;

            } else break;

        if (pos >= 0){

            this.forkStartingHeight = this.forkBlocks[pos].height;
            this.forkStartingHeightDownloading = this.forkBlocks[pos].height;

            for (let j=0; j<=pos; j++)
                if (this.blockchain.blocks[ this.forkBlocks[j].height ] !== this.forkBlocks[j])
                    this.forkBlocks[j].destroyBlock();
                else
                    this.forkBlocks[j] = undefined;


            this.forkBlocks.splice(0, pos);
        }

        if (this.forkBlocks.length !== 0) return true;
        else return false;

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

        if (! (await this._validateFork(false, true))) {
            Log.error("validateFork was not passed", Log.LOG_TYPE.BLOCKCHAIN_FORKS);
            return false
        }

        Log.log("Save Fork after validateFork", Log.LOG_TYPE.BLOCKCHAIN_FORKS);


        let revertActions = new RevertActions(this.blockchain);
        revertActions.push({action: "breakpoint"});

        let success;

        if (this.blockchain === undefined) success = false ; //fork was already destroyed
        else
            success = await this.blockchain.semaphoreProcessing.processSempahoreCallback( async () => {

                if (! (await this._validateFork(false, false))) {
                    Log.error("validateFork was not passed", Log.LOG_TYPE.BLOCKCHAIN_FORKS);
                    return false
                }

                if (!this.deleteAlreadyIncludedBlocks()){
                    Log.error("deleteAlreadyIncludedBlocks blocks no longer exist", Log.LOG_TYPE.BLOCKCHAIN_FORKS);
                    return false;
                }

                if (this.downloadBlocksSleep) await this.sleep(30);

                try {

                    //making a copy of the current blockchain
                    this.preForkClone();

                } catch (exception){
                    Log.error("preForkBefore raised an error", Log.LOG_TYPE.BLOCKCHAIN_FORKS);
                    return false;
                }

                if (this.downloadBlocksSleep) await this.sleep(20);

                try {

                    this.preFork(revertActions);

                } catch (exception){

                    Log.error("preFork raised an error", Log.LOG_TYPE.BLOCKCHAIN_FORKS, exception);

                    revertActions.revertOperations('', "all");
                    this._blocksCopy = []; //We didn't use them so far

                    try {
                        await this.revertFork();
                    } catch (exception){
                        Log.error("revertFork rasied an error", Log.LOG_TYPE.BLOCKCHAIN_FORKS, exception );
                    }

                    return false;
                }

                if (this.downloadBlocksSleep) await this.sleep(20);

                this.blockchain.blocks.spliceBlocks(this.forkStartingHeight, false, false);

                let forkedSuccessfully = true;

                Log.log("===========================", Log.LOG_TYPE.BLOCKCHAIN_FORKS);
                Log.log("===========================", Log.LOG_TYPE.BLOCKCHAIN_FORKS);

                //TODO use the revertActions to revert the process

                //show information about Transactions Hash
                if (consts.DEBUG) {

                    Log.log("Accountant Tree", Log.LOG_TYPE.BLOCKCHAIN_FORKS, this.blockchain.accountantTree.root.hash.sha256.toString("hex"));

                    for (let i = 0; i < this.forkBlocks.length; i++) {

                        for (let j = 0; j < this.forkBlocks[i].data.transactions.transactions.length; j++)
                            Log.log("Transaction", Log.LOG_TYPE.BLOCKCHAIN_FORKS, this.forkBlocks[i].data.transactions.transactions[j].toJSON());

                        Log.log("Transaction hash", Log.LOG_TYPE.BLOCKCHAIN_FORKS, this.forkBlocks[i].data.transactions.hashTransactions.toString("hex"));
                    }

                }

                let index;
                try {

                    for (index = 0; index < this.forkBlocks.length && (Blockchain.MinerPoolManagement === undefined || !Blockchain.MinerPoolManagement.minerPoolStarted); index++) {

                        StatusEvents.emit( "agent/status", { message: "Synchronizing - Including Block", blockHeight: this.forkBlocks[index].height, blockHeightMax: this.forkChainLength } );

                        this.forkBlocks[index].blockValidation = this._createBlockValidation_BlockchainValidation( this.forkBlocks[index].height , index);
                        this.forkBlocks[index].blockValidation.blockValidationType['skip-validation-PoW-hash'] = true; //It already validated the hash


                        this.forkBlocks[index].blockValidation.blockValidationType['skip-recalculating-hash-rate'] = true;

                        //await Blockchain.blockchain.sleep(10);

                        if (!process.env.BROWSER && (!this.downloadBlocksSleep || (index > 0 && index % 10 !== 0)))
                            this.forkBlocks[index].blockValidation.blockValidationType['skip-sleep'] = true;
                        else
                            await this.blockchain.sleep(2);




                        if (! (await this.saveIncludeBlock(index, revertActions, false, false)) )
                            throw( { message: "fork couldn't be included in main Blockchain ", index: index });

                        this.forkBlocks[index].socketPropagatedBy = this.socketsFirst;

                    }

                    await this.blockchain.saveBlockchain( this.forkStartingHeight );

                    if (!this.downloadBlocksSleep) await this.sleep(2);

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
                        revertActions.revertOperations('', "all");
                    } catch (exception){
                        Log.error("revertOptions raised an error", Log.LOG_TYPE.BLOCKCHAIN_FORKS, exception );
                    }
                    await this.sleep(30);

                    try {
                        //reverting back to the clones, especially light settings
                        await this.revertFork();
                    } catch (exception){
                        Log.error("revertFork raised an error", Log.LOG_TYPE.BLOCKCHAIN_FORKS, exception );
                    }

                    await this.sleep(30);

                }

                await this.postForkTransactions(forkedSuccessfully);

                if (this.downloadBlocksSleep) await this.sleep(30);

                this.postFork(forkedSuccessfully);

                if (this.downloadAllBlocks){
                    await this.sleep(30);
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
            this.blockchain.blocks.emitBlockInserted(  ) ;
        }

        // it was done successfully
        Log.info("FORK SOLVER SUCCESS: " + success, Log.LOG_TYPE.BLOCKCHAIN_FORKS);

        revertActions.destroyRevertActions();

        Blockchain.blockchain.accountantTree.emitBalancesChanges();
        Blockchain.blockchain.blocks.recalculateNetworkHashRate();
        Blockchain.blockchain.blocks.emitBlockInserted();
        Blockchain.blockchain.blocks.emitBlockCountChanged();

        try {

            if (success) {

                //successfully, let's delete the backup blocks
                this._deleteBackupBlocks();

                //propagate last block
                NodeBlockchainPropagation.propagateBlock(this.blockchain.blocks[this.blockchain.blocks.length - 1], this.sockets);

                if (this.downloadAllBlocks) {

                    await this.sleep(100);

                    this.blockchain.agent.protocol.askBlockchain(this.getSocket());

                }

            }
        } catch (exception){
            Log.error("saveFork - saving the fork returned an exception", Log.LOG_TYPE.BLOCKCHAIN_FORKS, exception);
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
            this._blocksCopy.forEach((block) => {

                if (block.data !==  undefined && block.data.transactions !== undefined)
                    block.data.transactions.unconfirmTransactions();

            });

            // this.forkBlocks.forEach((block)=> {
            //
            //     if (block.data !==  undefined && block.data.transactions !== undefined)
            //         block.data.transactions.confirmTransactions();
            //
            // });

        } else {

            this.forkBlocks.forEach((block)=>{

                if (block.data !==  undefined && block.data.transactions !== undefined)
                    block.data.transactions.unconfirmTransactions();

            });

            // this._blocksCopy.forEach( (block) => {
            //
            //     if (block.data !==  undefined && block.data.transactions !== undefined)
            //         block.data.transactions.confirmTransactions();
            //
            // });

        }



    }

    postFork(forkedSuccessfully){

    }

    async saveIncludeBlock(index, revertActions, saveBlock = false, showUpdate = false){

        if (! (await this.blockchain.includeBlockchainBlock( this.forkBlocks[index], false, "all", saveBlock, revertActions, showUpdate))) {
            Log.error("fork couldn't be included in main Blockchain " + index, Log.LOG_TYPE.BLOCKCHAIN_FORKS);
            return false;
        }

        return true;
    }

    _deleteBackupBlocks(){


        for (let i = 0; i < this._blocksCopy.length; i++)
            if ( this._blocksCopy[i] !== undefined && this._blocksCopy[i] !== null && this.blockchain.blocks[ this._blocksCopy[i].height ] !== this._blocksCopy[i] ) {
                this._blocksCopy[i].destroyBlock();
                this._blocksCopy[i] = undefined;
            }

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
        Log.error("fork save error", Log.LOG_TYPE.BLOCKCHAIN_FORKS, exception);

    }

    getSocket(){
        let socket = this.sockets;
        if (Array.isArray(socket))
            socket = socket[0];

        return socket;
    }

    _findSocket(socket){
        for (let i=0; i<this.sockets.length; i++)
            if (this.sockets[i] === socket)
                return i;

        return -1;
    }

    getForkSocket(index){

        if (this.sockets.length === 0) return undefined;

        if (! this.sockets[index % this.sockets.length].connected) {
            this.sockets.splice(index % this.sockets.length);
            return undefined;
        }
        return this.sockets[index % this.sockets.length];
    }

    pushSocket(socket, priority){

        if (this._findSocket(socket) === -1) {

            if (priority)
                this.sockets.splice(0,0, socket);
            else {

                if (socket.latency !== 0)
                    for (let i=0; i<this.sockets.length; i++)
                        if (this.sockets[i].latency > socket.latency)
                            return this.sockets.splice(i, 0, socket);

                this.sockets.push(socket)
            }

        }

    }

    pushHeaders(hashes){

        for (let i=0; i<hashes.length; i++)
            this.pushHeader(hashes[i]);

    }

    pushHeader(hash){

        if ( !hash ) return;

        for (let i=0; i<this.forkHeaders.length; i++)
            if (this.forkHeaders[i].equals( hash ) )
                return;

        this.forkHeaders.push(hash);

    }


    toJSON(){

        return {
            forkReady: this.forkReady,
            forkStartingHeightDownloading: this.forkStartingHeightDownloading,
            forkChainStartingPoint: this.forkChainStartingPoint,
            forkChainLength: this.forkChainLength,
            forkBlocks: this.forkBlocks.length,
            forkHeaders: this.forkHeaders,
        }

    }

}

export default InterfaceBlockchainFork;