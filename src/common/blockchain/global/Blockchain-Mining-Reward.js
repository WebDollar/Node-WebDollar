const BigNumber = require('bignumber.js');

class BlockchainMiningReward{


    getSumReward(height){

        let sum = 0;

        //TODO to be finished
        //!!! it will work until the first cycle will end
        while ( height > 0){

            sum += this.getReward(height) * height;

            height = height - 6307200;
        }

        return sum;

    }

    getReward(height){

        if (typeof height !== "number")
            throw ('height is not defined');

        if (height >= 0) {

            // ToDO - Budisteanu shift
            let cycleNumber = Math.trunc( height / 6307200 );
            let reward = WebDollarCoins.WEBD * 3000/(1 << cycleNumber);
            let smallestReward = 1;

            if (reward < smallestReward)
                reward = smallestReward;

            return reward;
        }

    }

    _getContinuousReward(height) {

        if (typeof height !== "number")
            throw ('height is not defined');

        if (height >= 0) {
            //TODO: implement continuous reward function
        }

    }

}

export default new BlockchainMiningReward();