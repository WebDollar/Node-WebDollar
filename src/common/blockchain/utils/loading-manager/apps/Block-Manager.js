import MemoryManager from "./../Memory-Manager"
import Blockchain from "main-blockchain/Blockchain";

class BlockManager extends MemoryManager{

    async getData(height) {

        if (this.savingManager._pendingBlocks[height]) {
            let data = await this.savingManager._pendingBlocks[height];
            if (data)
                return data;
        }

        return MemoryManager.prototype.getData.call(this, height);

    }

    async _loadData(height){

        try {
            let block = await this.blockchain.blockCreator.createEmptyBlock( height );

            //TODO change the condition for SPV
            if( !this.blockchain.agent.light )
                block.difficultyTargetPrev = await this.blockchain.getDifficultyTarget(height-1);

            block.difficultyTarget = await this.loadingManager.getBlockDifficulty(height);
            block.hash = await this.blockchain.getHash(height);
            block.hashChain = await this.blockchain.getChainHash(height);

            if (await block.loadBlock() === false)
                throw {message: "no block to load was found"};

            this.addToLoaded(height, block);

            return block;

        } catch (exception){

            console.error("Loading Manager raised an exception", exception);

        }

    }

    _validateDataForRemoval(data){
        return !data || !data.data || !data.data.isForkBlock;
    }

}

export default BlockManager;