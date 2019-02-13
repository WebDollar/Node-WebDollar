import MemoryManager from "./../Memory-Manager"

class BlockHashManager extends MemoryManager{

    async _loadData(height){
        return this.blockchain.db.get("blockHash"+height);
    }

    async getData(height) {

        if (this.savingManager._pendingBlocks[height])
            return this.savingManager._pendingBlocks[height].hash;

        return MemoryManager.prototype.getData.call(this, height);
    }

}

export default BlockHashManager;