const BigInteger = require('big-integer');

import MemoryManager from "./../Memory-Manager"
import Serialization from "common/utils/Serialization"

class ChainWorkManager extends MemoryManager{

    async _loadData(height){

        let buffer = await this.blockchain.db.get("chainWork"+height);
        if (buffer)
            return Serialization.deserializeBigInteger(buffer);

        return (await this.loadingManager.getBlock( height )).getChainWork();

    }

    async getData(height){

        if (height < 0)
            return BigInteger(0);

        if (this.savingManager._pendingBlocks[height]) {
            let data = await this.savingManager._pendingBlocks[height];
            if (data)
                return data.getChainWork();
        }

        if (this.loadingManager.blockManager._loaded[height]) {
            let data = await this.loadingManager.blockManager._loaded[height].data;
            if (data)
                return data.getChainWork();
        }

        return MemoryManager.prototype.getData.call(this, height);

    }

}

export default ChainWorkManager;