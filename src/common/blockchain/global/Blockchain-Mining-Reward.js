const BigNumber = require('bignumber.js');

class BlockchainMiningReward{

    getReward(height){

        if (typeof height !== "number") throw ('height is not defined');

        if (height >=0) {
            let reward = new BigNumber(50).dividedBy(height + 1);
            let smallestNumber = new BigNumber(0.0001);

            if (reward.lessThan(smallestNumber)) reward = smallestNumber;

            return reward;
        }

    }

}

export default new BlockchainMiningReward();