import MemoryManager from "./../Memory-Manager"

class BlocksManager extends MemoryManager{

    constructor(blockchain, savingManager, difficultyManager, chainHashManager, hashManager) {

        super(blockchain, savingManager );

        this._difficultyManager = difficultyManager;
        this._chainHashManager = chainHashManager;
        this._hashManager = hashManager;

    }

    async getData(height) {

        if (this.savingManager._pendingBlocksList[height])
            return this.savingManager._pendingBlocksList[height][0].block;

        return MemoryManager.prototype.getData.call(height);

    }

    async _loadData(height){

        try {
            let block = await this.blockchain.blockCreator.createEmptyBlock( height );

            block.difficultyTargetPrev = this._difficultyManager.getData(height);
            block.difficultyTarget = this._difficultyManager.getData(height+1);
            block.hash = this._hashManager.getData(height+1);
            //block.chainHash = this._chainHashManager

            if (await block.loadBlock() === false)
                throw {message: "no block to load was found"};

            this.addToLoaded(height, block);

            return block;

        } catch (exception){

            console.error("Loading Manager raised an exception", exception);

        }

    }

}

export default BlocksManager;