import MemoryManager from "./../Memory-Manager"

class BlockHashManager extends MemoryManager{

    async _loadData(height){
        return this.blockchain.db.get("blockTimestamp"+height);
    }

    async getData(height) {

        if (this.savingManager._pendingBlocks[height])
            return (await this.savingManager._pendingBlocks[height]).timeStamp;

        if (this.loadingManager.blockManager._loaded[height])
            return (await this.loadingManager.blockManager._loaded[height]).data.timeStamp;

        return MemoryManager.prototype.getData.call(this, height);
    }

}

export default BlockHashManager;