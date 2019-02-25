import MemoryManager from "../../Memory-Manager"

class BlockHeaderBufferManager extends MemoryManager{

    async _loadData(height){
        return this.blockchain.db.get("block"+height);
    }

    async getData(height) {

        if (this.savingManager._pendingBlocks[height]) {
            let data = await this.savingManager._pendingBlocks[height];
            if (data)
                return data.serializeBlock(true);
        }

        if (this.loadingManager.blockManager._loaded[height]) {
            let data = await this.loadingManager.blockManager._loaded[height].data;
            if (data)
                return data.serializeBlock(true);
        }

        return MemoryManager.prototype.getData.call(this, height);

    }



}

export default BlockHeaderBufferManager;