import MemoryManager from "./../Memory-Manager"

class BlockDifficultyManager extends MemoryManager{

    async _loadData(height){
        return this.blockchain.db.get("blockDiff"+height);
    }

    async getData(height) {

        if (this.savingManager._pendingBlocksList[height])
            return this.savingManager._pendingBlocksList[height][0].targetDifficulty;

        return MemoryManager.prototype.getData.call(this, height);

    }

}

export default BlockDifficultyManager;