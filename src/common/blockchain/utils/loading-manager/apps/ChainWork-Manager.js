const BigInteger = require('big-integer');

import MemoryManager from "./../Memory-Manager"
import Serialization from "common/utils/Serialization"

class ChainWorkManager extends MemoryManager{

    async _loadData(height){

        if (height < 0)
            return BigInteger(0);

        if (this.savingManager._pendingBlocks[height])
            return (await this.savingManager._pendingBlocks[height]).getChainWork( );

        if (this.loadingManager.blockManager._loaded[height])
            return (await this.loadingManager.getBlock(height)).getChainWork();

        let buffer = await this.blockchain.db.get("chainWork"+height);
        return Serialization.deserializeBigInteger(buffer);
    }

}

export default ChainWorkManager;