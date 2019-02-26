import consts from "consts/const_global";

import BlockBufferManager from "./apps/buffers/Block-Buffer-Manager"
import BlockHeaderBufferManager from "./apps/buffers/Block-Header-Buffer-Manager"
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

        this.blockBufferManager = new BlockBufferManager(blockchain, savingManager, this, 100 );
        this.blockHeaderBufferManager = new BlockHeaderBufferManager(blockchain, savingManager, this, 100 );

        this.blockDifficultyManager = new BlockDifficultyManager(blockchain, savingManager, this, 2000);
        this.blockChainHashManager = new BlockChainHashManager(blockchain, savingManager, this, 2000);
        this.blockHashManager = new BlockHashManager(blockchain, savingManager, this, 2000);
        this.blockTimestampManager = new BlockTimestampManager(blockchain, savingManager, this, 2000);

        this.blockManager = new BlockManager(blockchain, savingManager, this, 1000);

        this.chainWorkManager = new ChainWorkManager(blockchain, savingManager, this, 2000);

    }

    async getBlockBuffer(height){
        return this.blockBufferManager.getData(height);
    }

    async getBlockHeaderBuffer(height){
        return this.blockHeaderBufferManager.getData(height);
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

    async getBlock(height){
        return this.blockManager.getData(height);
    }

    async getChainWork(height){
        return this.chainWorkManager.getData(height);
    }


    async readBlockchainLength(){

        let numBlocks = await this.blockchain.db.get( this.blockchain._blockchainFileName, 20000, 20);

        if ( !numBlocks ) {
            Log.error("Error reading the blocks.length", Log.LOG_TYPE.SAVING_MANAGER);
            return undefined;
        }

        return numBlocks;
    }


    async addBlockToLoaded(block){

        let height = block.height;

        this.blockManager.addToLoaded(height, block);

    }

    async deleteBlock(height, block){

        if (block instanceof Promise) block = await block;

        this.blockManager.deleteLoaded(height, block);
        this.blockHashManager.deleteLoaded(height, block.hash);
        this.blockDifficultyManager.deleteLoaded(height, block.difficultyTarget);
        this.blockChainHashManager.deleteLoaded(height, block.hashChain);
        this.blockTimestampManager.deleteLoaded(height, block.timeStamp);
        this.blockBufferManager.deleteLoaded(height, await block.serializeBlock(false ));
        this.blockHeaderBufferManager.deleteLoaded(height, await block.serializeBlock(true ));
        this.chainWorkManager.deleteLoaded(height, await block.getChainWork() );
    }

}

export default LoadingManager;