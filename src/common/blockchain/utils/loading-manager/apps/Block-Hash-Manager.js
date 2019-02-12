import MemoryManager from "./../Memory-Manager"

class BlockHashManager extends MemoryManager{

    async _loadData(height){
        return this.blockchain.db.get("blockHash"+height);
    }

    async getData(height) {

        if (this.savingManager._pendingBlocksList[height])
            return this.savingManager._pendingBlocksList[height][0].hash;

        return MemoryManager.prototype.getData.call(height);
    }

}

export default BlockHashManager;