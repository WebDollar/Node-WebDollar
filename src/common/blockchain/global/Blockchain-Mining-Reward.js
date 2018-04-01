const BigNumber = require('bignumber.js');

class BlockchainMiningReward{

    getReward(height){

        if (typeof height !== "number")
            throw ('height is not defined');

        if (height >= 0) {

            let cicleNumber = Math.trunc(height / 6307200);
            let reward = new BigNumber(3000).dividedBy(1 << cicleNumber);
            let smallestReward = new BigNumber(0.00001);

            if (reward.isLessThan(smallestReward))
                reward = smallestReward;

            return reward;
        }

    }

}

export default new BlockchainMiningReward();