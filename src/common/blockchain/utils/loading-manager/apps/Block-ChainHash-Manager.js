import MemoryManager from "./../Memory-Manager"

class BlockChainHashManager extends MemoryManager{

    async _loadData(height){
        return this.blockchain.db.get("blockChainHash"+height);
    }

    async getData(height) {

        if (this.savingManager._pendingBlocks[height])
            return (await this.savingManager._pendingBlocks[height]).hashChain;

        if (this.loadingManager.blockManager._loaded[height])
            return (await this.loadingManager.blockManager._loaded[height]).data.hashChain;

        return MemoryManager.prototype.getData.call(this, height);

    }

}

export default BlockChainHashManager;