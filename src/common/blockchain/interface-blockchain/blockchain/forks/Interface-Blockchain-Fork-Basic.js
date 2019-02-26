var BigInteger = require('big-integer');
import InterfaceBlockchainBlockValidation from "../../blocks/validation/Interface-Blockchain-Block-Validation";

import BlockchainGenesis from 'common/blockchain/global/Blockchain-Genesis'
import consts from 'consts/const_global'
import Log from 'common/utils/logging/Log';

/**
 * Blockchain contains a chain of blocks based on Proof of Work
 */
class InterfaceBlockchainFork {


    constructor (){

        this.forkIsSaving = false;

        this.downloadBlocksSleep = false;
        this.downloadAllBlocks = false;

    }

    /**
     * initializeConstructor is used to initialize the constructor dynamically using .apply method externally passing the arguments
     */

    initializeConstructor(blockchain, forkId, sockets, forkStartingHeight, forkChainStartingPoint, forkChainLength, forkChainWork, forkChainHashes = {}, forkReady = false){

        this.blockchain = blockchain;

        this.forkId = forkId;

        if (!Array.isArray(sockets))
            sockets = [sockets];

        this.socketsFirst = sockets[0];
        this.sockets = sockets;

        this.forkReady = false;

        this.forkStartingHeight = forkStartingHeight||0;

        this.forkChainStartingPoint = forkChainStartingPoint;
        this.forkChainLength = forkChainLength||0;
        this.forkBlocks = [];
        this.forkChainWork = forkChainWork;

        this.forkChainHashes = forkChainHashes;

        this.forkPromise = new Promise ((resolve)=>{
            this._forkPromiseResolver = resolve;
        });

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


    async _validateChainWork(){

        let chainWork = 0;
        if (this.forkStartingHeight < this.blockchain.blocks.length) {
            let chainWorkFirst = await this.blockchain.blocks.loadingManager.getChainWork(this.forkStartingHeight);
            let chainWorkEnd = await this.blockchain.blocks.loadingManager.getChainWork(this.blockchain.blocks.length - 1);
            chainWork = chainWorkEnd.minus(chainWorkFirst);
        }

        let forkWork = new BigInteger(0);
        for (let i=0; i< this.forkBlocks.length; i++ )
            forkWork = forkWork.plus( this.forkBlocks[i].workDone );

        if ( forkWork.lesser( chainWork  ) )
            throw {message: "forkWork is less than chainWork", forkWork: forkWork.toString(), chainWork: chainWork.toString() };

    }

    initializeFork(){
        this.forkReady = true;
        return true;
    }

    getForkBlock(height){

        if (height ===  -1) return BlockchainGenesis; // based on genesis block

        let forkHeight = height - this.forkStartingHeight;

        if ( forkHeight >= 0) return this.forkBlocks[forkHeight]; // just the fork
        return this.blockchain.getBlock(height) // the blockchain

    }

    // return the difficultly target for ForkBlock
    getForkDifficultyTarget(height, POSRecalculation = true){

        if (height === -1) return BlockchainGenesis.difficultyTarget; // based on genesis block
        if (height === consts.BLOCKCHAIN.HARD_FORKS.POS_ACTIVATION-1) return BlockchainGenesis.difficultyTargetPOS;

        let forkHeight = height - this.forkStartingHeight;

        let heightPrePOS = height;
        if (height >= consts.BLOCKCHAIN.HARD_FORKS.POS_ACTIVATION-1) {

            //calculating the virtualization of the POS
            if (height % 30 === 29) height = height - 10;  //first POS, get the last proof of Stake
            else if (height % 30 === 19) height = height - 20; //first POW, get the last proof of Work

            forkHeight = height - this.forkStartingHeight;
        }


        if ( forkHeight >= 0) return this.forkBlocks[ forkHeight ].difficultyTarget; // just the fork

        return this.blockchain.getDifficultyTarget(heightPrePOS, POSRecalculation) // the blockchain

    }

    getForkTimeStamp(height){

        if (height <= -1) return BlockchainGenesis.timeStamp;

        let forkHeight = height - this.forkStartingHeight;

        if ( forkHeight >= 0) return this.forkBlocks[forkHeight].timeStamp; // just the fork

        return this.blockchain.getTimeStamp(height) // the blockchain

    }

    getForkHash(height){

        if (height === -1) return BlockchainGenesis.hashPrev; // based on genesis block

        let forkHeight = height - this.forkStartingHeight;

        if ( forkHeight >= 0) return this.forkBlocks[forkHeight].hash; // just the fork

        return this.blockchain.getHash(height) // the blockchain
    }

    getForkChainHash(height){

        if (height  === -1) return BlockchainGenesis.hashPrev;

        let forkHeight = height - this.forkStartingHeight;

        if (forkHeight >= 0) return this.forkBlocks[ forkHeight ].hashChain;

        return this.blockchain.getChainHash(height);

    }

    _createBlockValidation_ForkValidation(height, forkHeight){

        let validationType = {};

        return new InterfaceBlockchainBlockValidation(this.getForkBlock.bind(this), this.getForkDifficultyTarget.bind(this), this.getForkTimeStamp.bind(this), this.getForkHash.bind(this), this.getForkChainHash.bind(this), validationType );
    }

    _createBlockValidation_BlockchainValidation(height, forkHeight){

        let validationType = {};

        if (height !== this.forkChainLength-1)
            validationType["skip-calculating-proofs"] = true;

        validationType["skip-recalculating-hash-rate"] = true;

        return new InterfaceBlockchainBlockValidation(this.getForkBlock.bind(this), this.getForkDifficultyTarget.bind(this), this.getForkTimeStamp.bind(this), this.getForkHash.bind(this), this.getForkChainHash.bind(this), validationType );
    }

    async deleteAlreadyIncludedBlocks(){

        //verify if now, I have some blocks already in my the blockchain that are similar with the fork
        let pos = -1;
        for (let i=0; i<this.forkBlocks.length-1; i++) {

            if (this.forkBlocks[i].height > this.blockchain.blocks.length-1)
                break;

            let hashChain = await this.blockchain.getChainHash( this.forkBlocks[i].height );
            if ( hashChain && hashChain.equals(this.forkBlocks[i].hashChain)) pos = i;
            else break;

        }

        if (pos >= 0){

            this.forkStartingHeight = this.forkBlocks[pos].height;

            this.forkBlocks.splice(0, pos);
        }

        return this.forkBlocks.length !== 0;

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

        index = index % this.sockets.length;

        if (! this.sockets[ index ].connected) {
            this.sockets.splice(index, 1);
            return undefined;
        }
        return this.sockets[ index ];
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

    toJSON(){

        return {
            forkReady: this.forkReady,
            forkChainStartingPoint: this.forkChainStartingPoint,
            forkChainLength: this.forkChainLength,
            forkBlocks: this.forkBlocks.length,
            forkChainHashes: this.forkChainHashes,
        }

    }

}

export default InterfaceBlockchainFork;