import MemoryManager from "./../Memory-Manager"

class BlockChainHashManager extends MemoryManager{

    async _loadData(height){
        return this.blockchain.db.get("blockChainHash"+height);
    }

    async getData(height) {

        if (this.savingManager._pendingBlocksList[height])
            return this.savingManager._pendingBlocksList[height][0].block;

        return MemoryManager.prototype.getData.call(height);

    }

}

export default BlockChainHashManager;