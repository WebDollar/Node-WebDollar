import InterfaceBlockchainBlockValidation from "common/blockchain/interface-blockchain/blocks/validation/Interface-Blockchain-Block-Validation"

const CLEAR_OLD_UNSED_BLOCKS_INTERVAL = 60*1000;

class LoadingManager{

    constructor(blockchain){

        this.blockchain = blockchain;

        this.loadedBlocks = {};

        this._intervalClearOldUnsuedBlocks = setTimeout( this._clearOldUnusedBlocks.bind(this), CLEAR_OLD_UNSED_BLOCKS_INTERVAL );

    }

    async getBlock(height){

        if(this.loadedBlocks[height]!==undefined){

            this.loadedBlocks[height].lastTimeUsed = new Date().getTime();
            return this.loadedBlocks[height];

        }else{

            return await this._loadBlock(height);

        }

    }

    async _loadBlock(height){

        let validationType = this.blockchain.setFastLoadingValidationType(undefined);

        let blockValidation = new InterfaceBlockchainBlockValidation( this.blockchain.getBlock.bind(this), this.blockchain.getDifficultyTarget.bind(this), this.blockchain.getTimeStamp.bind(this), this.blockchain.getHashPrev.bind(this), validationType );

        let block = await this.blockchain._loadBlock(height, height, blockValidation);

        block.lastTimeUsed = new Date().getTime();
        this.loadedBlocks[height] = block;

        return block;

    }

    async _clearOldUnusedBlocks(){

        for (let key in this.loadedBlocks){

            if(new Date().getTime() - this.loadedBlocks[key].lastTimeUsed > CLEAR_OLD_UNSED_BLOCKS_INTERVAL) {

                //check if it is not being saved by the Save Manager

                this.loadedBlocks[key].destroyBlock();
                delete this.loadedBlocks[key];
            }

        }

        this._intervalClearOldUnsuedBlocks = setTimeout( this._clearOldUnusedBlocks.bind(this), CLEAR_OLD_UNSED_BLOCKS_INTERVAL );

    }

}

export default LoadingManager;