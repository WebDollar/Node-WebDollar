const BigNumber = require('bignumber.js');

class BlockchainMiningReward{

    getReward(height){

        if (typeof height !== "number") throw ('height is not defined');

        if (height >= 0) {

            let cicleNumber = Math.trunc(height / 8409600);
            let reward = new BigNumber(2500).dividedBy(1 << cicleNumber);
            let smallestReward = new BigNumber(0.0001);

            if (reward.isLessThan(smallestReward)) reward = smallestReward;

            return reward;

        }

    }

}

export default new BlockchainMiningReward();