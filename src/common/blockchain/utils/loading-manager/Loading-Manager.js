import consts from "consts/const_global";

import BlockManager from "./apps/Block-Manager"
import BlockDifficultyManager from "./apps/Block-Difficulty-Manager"
import BlockChainHashManager from "./apps/Block-ChainHash-Manager"
import BlockHashManager from "./apps/Block-Hash-Manager"
import BlockTimestampManager from "./apps/Block-Timestamp-Manager"
import ChainWorkManager from "./apps/ChainWork-Manager";
import Log from "../../../utils/logging/Log";

class LoadingManager{

    constructor(blockchain, savingManager){

        this.blockchain = blockchain;
        this.savingManager = savingManager;

        this.blockDifficultyManager = new BlockDifficultyManager(blockchain, savingManager, this);
        this.blockChainHashManager = new BlockChainHashManager(blockchain, savingManager, this);
        this.blockHashManager = new BlockHashManager(blockchain, savingManager, this);
        this.blockTimestampManager = new BlockTimestampManager(blockchain, savingManager, this);

        this.blockManager = new BlockManager(blockchain, savingManager, this);

        this.chainWorkManager = new ChainWorkManager(blockchain, savingManager, this);

    }

    async getBlockTimestamp(height){
        return this.blockTimestampManager.getData(height);
    }

    async getBlockDifficulty(height){
        return this.blockDifficultyManager.getData(height);
    }

    async getBlockHash(height){
        return this.blockHashManager.getData(height);
    }

    async getBlockChainHash(height){
        return this.blockChainHashManager.getData(height);
    }

    async getBlockWork(height){
        let prevDifficulty = await this.getBlockDifficulty(height );
        return consts.BLOCKCHAIN.BLOCKS_MAX_TARGET_BIG_INTEGER.divide( new BigInteger( prevDifficulty.toString("hex"), 16 ) );
    }

    async getBlock(height){
        return this.blockManager.getData(height);
    }

    async getChainWork(height){
        return this.chainWorkManager.getData(height);
    }


    async readBlockchainLength(){

        let numBlocks = await this.blockchain.db.get( this.blockchain._blockchainFileName, 20000, 1000000);

        if ( !numBlocks ) {
            Log.error("Error reading the blocks.length", Log.LOG_TYPE.SAVING_MANAGER);
            return undefined;
        }

        return numBlocks;
    }


    async addBlockToLoaded(height, block){

        this.blockDifficultyManager.addToLoaded(height, block.difficultyTarget);
        this.blockHashManager.addToLoaded(height, block.hash);
        this.blockChainHashManager.addToLoaded(height, block.hashChain);
        this.blockTimestampManager.addToLoaded(height, block.timeStamp);
        this.blockManager.addToLoaded(height, block);
        this.chainWorkManager.addToLoaded(height, block.getChainWork() );

    }

    async deleteBlock(height, block){
        this.blockDifficultyManager.deleteLoaded(height, block.difficultyTarget);
        this.blockHashManager.deleteLoaded(height, block.hash);
        this.blockChainHashManager.deleteLoaded(height, block.hashChain);
        this.blockTimestampManager.deleteLoaded(height, block.timeStamp);
        this.blockManager.deleteLoaded(height, block);
        this.chainWorkManager.deleteLoaded(height, block.getChainWork() );
    }

}

export default LoadingManager;