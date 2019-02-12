import MemoryManager from "./../Memory-Manager"

class HashManager extends MemoryManager{

    async _loadData(height){
        return this.blockchain.db.get("blockHash"+height);
    }

}

export default HashManager;