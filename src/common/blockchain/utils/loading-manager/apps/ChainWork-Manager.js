const BigInteger = require('big-integer');

import MemoryManager from "./../Memory-Manager"
import Serialization from "common/utils/Serialization"

class ChainWorkManager extends MemoryManager{

    async _loadData(height){

        if (height < 0)
            return BigInteger(0);

        let buffer = await this.blockchain.db.get("chainWork"+height);
        return Serialization.deserializeBigInteger(buffer);
    }

}

export default ChainWorkManager;