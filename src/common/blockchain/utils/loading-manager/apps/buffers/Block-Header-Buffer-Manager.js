import MemoryManager from "../../Memory-Manager"

class BlockHeaderBufferManager extends MemoryManager{

    async _loadData(height){
        return this.blockchain.db.get("block"+height);
    }

    async getData(height) {

        if (this.savingManager._pendingBlocks[height])
            return (await this.savingManager._pendingBlocks[height]).block.serializeBlock( true );

        if (this.loadingManager.blockManager._loaded[height])
            return (await this.loadingManager.blockManager.getData(height)).serializeBlock( true );

        return MemoryManager.prototype.getData.call(this, height);

    }



}

export default BlockHeaderBufferManager;