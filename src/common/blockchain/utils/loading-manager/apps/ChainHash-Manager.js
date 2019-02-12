import MemoryManager from "./../Memory-Manager"

class ChainHashManager extends MemoryManager{

    async _loadData(height){
        return this.blockchain.db.get("blockChainHash"+height);
    }

}

export default ChainHashManager;