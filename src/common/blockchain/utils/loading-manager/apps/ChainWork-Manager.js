import MemoryManager from "./../Memory-Manager"

class ChainWorkManager extends MemoryManager{

    async _loadData(height){
        return this.blockchain.db.get("ChainWork"+height);
    }

}

export default ChainWorkManager;