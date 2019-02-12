import consts from "consts/const_global";

import BlocksManager from "apps/Blocks-Manager"
import DifficultyManager from "apps/Difficulty-Manager"
import ChainHashManager from "apps/ChainHash-Manager"
import HashManager from "apps/Hash-Manager"

class LoadingManager{

    constructor(blockchain, savingManager){

        this.blockchain = blockchain;
        this.savingManager = savingManager;

        this._loadedBlocks = {};
        this._loadedBlocksCount = 0;

        this.difficultyManager = new DifficultyManager(blockchain, savingManager);
        this.chainHashManager = new ChainHashManager(blockchain, savingManager);
        this.blocksManager = new BlocksManager(blockchain, savingManager, this.difficultyManager, this.chainHashManager);

    }

    async getBlockDifficulty(height){
        return this.blockchain.db.get("blockDiff"+height);
    }

    async getBlockHash(height){
        return this.blockchain.db.get("blockHash"+height);
    }

    async getBlockWork(height){
        let prevDifficulty = await this.getBlockDifficulty(height );
        return consts.BLOCKCHAIN.BLOCKS_MAX_TARGET_BIG_INTEGER.divide( new BigInteger( prevDifficulty.toString("hex"), 16 ) );
    }

    async getBlock(height){

        if ( this.savingManager._pendingBlocksList[height] )
            return this.savingManager._pendingBlocksList[height][0].block;

        if (height >= this.blockchain.blocks.length)
            throw {message: "getBlock  invalid height", height: height};

        if (this._loadedBlocks[height]){

            this._loadedBlocks[height].lastTimeUsed = new Date().getTime();
            return this._loadedBlocks[height];

        }else
            return this._loadBlock(height);

    }

    async _loadBlock(height){



    }





}

export default LoadingManager;