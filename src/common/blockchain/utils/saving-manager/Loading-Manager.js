import InterfaceBlockchainBlockValidation from "common/blockchain/interface-blockchain/blocks/validation/Interface-Blockchain-Block-Validation"
import consts from "consts/const_global";

const CLEAR_OLD_UNSED_BLOCKS_INTERVAL = 60*1000;

class LoadingManager{

    constructor(blockchain, savingManager){

        this.blockchain = blockchain;
        this.savingManager = savingManager;

        this.loadedBlocks = {};

        this._intervalClearOldUnsuedBlocks = setTimeout( this._clearOldUnusedBlocks.bind(this), CLEAR_OLD_UNSED_BLOCKS_INTERVAL );

    }

    async getBlockDifficulty(height){
        return this.blockchain.db.get("blockDiff"+height);
    }

    async getBlockWork(height){
        let prevDifficulty = await this.getBlockDifficulty(height );
        return consts.BLOCKCHAIN.BLOCKS_MAX_TARGET_BIG_INTEGER.divide( new BigInteger( prevDifficulty.toString("hex"), 16 ) );
    }

    async getBlock(height){

        if (this.savingManager[]  )

        if (height >= this.blockchain.blocks.length)
            throw {message: "getBlock  invalid height", height: height};

        if (!this.loadedBlocks[height]){

            this.loadedBlocks[height].lastTimeUsed = new Date().getTime();
            return this.loadedBlocks[height];

        }else
            return this._loadBlock(height);

    }

    async _loadBlock(height){

        let validationType = this.blockchain.setFastLoadingValidationType(undefined);

        let blockValidation = new InterfaceBlockchainBlockValidation( this.blockchain.getBlock.bind(this.blockchain), this.blockchain.getDifficultyTarget.bind(this.blockchain), this.blockchain.getTimeStamp.bind(this.blockchain), this.blockchain.getHashPrev.bind(this.blockchain), validationType );

        try {
            let block = this.blockchain.blockCreator.createEmptyBlock(height, blockValidation);
            block.height = height;

            block.prevDifficultyTarget = this.blockchain.getDifficultyTarget(height);
            block.difficultyTarget = this.blockchain.getDifficultyTarget(height+1, true);

            if (await block.loadBlock() === false)
                throw {message: "no block to load was found"};

            block.lastTimeUsed = new Date().getTime();
            this.loadedBlocks[height] = block;

            return block;

        } catch (exception){

            console.error("Loading Manager raised an exception", exception);

        }

        return null;

    }

    async _clearOldUnusedBlocks(){

        for (let key in this.loadedBlocks){

            if (new Date().getTime() - this.loadedBlocks[key].lastTimeUsed > CLEAR_OLD_UNSED_BLOCKS_INTERVAL) {

                //check if it is not being saved by the Save Manager

                delete this.loadedBlocks[key];

            }

        }

        this._intervalClearOldUnsuedBlocks = setTimeout( this._clearOldUnusedBlocks.bind(this), CLEAR_OLD_UNSED_BLOCKS_INTERVAL );

    }

}

export default LoadingManager;