import MemoryManager from "./../Memory-Manager"

class BlockHashManager extends MemoryManager{

    async _loadData(height){
        return this.blockchain.db.get("blockTimestamp"+height);
    }

    async getData(height) {

        if (this.savingManager._pendingBlocksList[height])
            return this.savingManager._pendingBlocksList[height][0].timeStamp;

        return MemoryManager.prototype.getData.call(this, height);
    }

}

export default BlockHashManager;