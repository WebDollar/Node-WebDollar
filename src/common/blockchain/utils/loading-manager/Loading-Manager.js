import consts from "consts/const_global";

import BlockManager from "apps/Blocks-Manager"
import BlockDifficultyManager from "apps/Difficulty-Manager"
import BlockChainHashManager from "apps/ChainHash-Manager"
import BlockHashManager from "apps/Hash-Manager"

class LoadingManager{

    constructor(blockchain, savingManager){

        this.blockchain = blockchain;
        this.savingManager = savingManager;

        this.difficultyManager = new BlockDifficultyManager(blockchain, savingManager);
        this.chainHashManager = new BlockChainHashManager(blockchain, savingManager);
        this.blocksManager = new BlockManager(blockchain, savingManager, this.difficultyManager, this.chainHashManager);
        this.hashManager = new BlockHashManager(blockchain, savingManager);
        this.chainWork = new ChainWork(blockchain, savingManager);

    }

    async getBlockDifficulty(height){
        return this.difficultyManager.getData(height);
    }

    async getBlockHash(height){
        return this.hashManager.getData(height);
    }

    async getBlockWork(height){
        let prevDifficulty = await this.getBlockDifficulty(height );
        return consts.BLOCKCHAIN.BLOCKS_MAX_TARGET_BIG_INTEGER.divide( new BigInteger( prevDifficulty.toString("hex"), 16 ) );
    }

    async getBlock(height){
        return this.blocksManager.getData(height);
    }


}

export default LoadingManager;