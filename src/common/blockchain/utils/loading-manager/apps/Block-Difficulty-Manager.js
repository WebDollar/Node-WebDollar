import MemoryManager from "./../Memory-Manager"

class BlockDifficultyManager extends MemoryManager{

    async _loadData(height){
        return this.blockchain.db.get("blockDiff"+height);
    }

    _validateHeight(height){
        if (height > this.blockchain.blocks.length)
            throw {message: "getData  invalid height", height: height};
    }

    async getData(height) {

        if (this.savingManager._pendingBlocks[height])
            return (await this.savingManager._pendingBlocks[height]).difficultyTarget;

        return MemoryManager.prototype.getData.call(this, height);

    }

}

export default BlockDifficultyManager;