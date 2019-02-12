import MemoryManager from "./../Memory-Manager"

class DifficultyManager extends MemoryManager{

    async _loadData(height){
        return this.blockchain.db.get("blockDiff"+height);
    }

}

export default DifficultyManager;