const BigDecimal = require('decimal.js');

class BlockchainMiningReward{

    getReward(height){

        if (typeof height !== "number") throw ('height is not defined');

        if (height >=0)
            return new BigDecimal(50).dividedBy(height+1);

    }

}

export default new BlockchainMiningReward();