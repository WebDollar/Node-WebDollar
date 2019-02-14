import MemoryManager from "./../Memory-Manager"

class BlockManager extends MemoryManager{

    constructor(blockchain, savingManager, difficultyManager, chainHashManager, hashManager) {

        super(blockchain, savingManager );

        this._difficultyManager = difficultyManager;
        this._chainHashManager = chainHashManager;
        this._hashManager = hashManager;
        this._chainHashManager = chainHashManager;

    }

    async getData(height) {

        if (this.savingManager._pendingBlocks[height])
            return this.savingManager._pendingBlocks[height];

        return MemoryManager.prototype.getData.call(this, height);

    }

    async _loadData(height){

        try {
            let block = await this.blockchain.blockCreator.createEmptyBlock( height );

            block.difficultyTargetPrev = await this._difficultyManager.getData(height-1);
            block.difficultyTarget = await this._difficultyManager.getData(height);
            block.hash = await this._hashManager.getData(height);
            block.chainHash = await this._chainHashManager.getData(height);

            if (await block.loadBlock() === false)
                throw {message: "no block to load was found"};

            this.addToLoaded(height, block);

            return block;

        } catch (exception){

            console.error("Loading Manager raised an exception", exception);

        }

    }



}

export default BlockManager;