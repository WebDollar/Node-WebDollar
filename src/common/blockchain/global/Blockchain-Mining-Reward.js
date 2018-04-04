import WebDolalrCoins from "common/utils/coins/WebDollar-Coins"

class BlockchainMiningReward{

    getReward(height){

        if (typeof height !== "number")
            throw ('height is not defined');

        if (height >= 0) {

            // ToDO - Budisteanu shift
            let cycleNumber = Math.trunc( height / 6307200 );
            let reward = WebDolalrCoins.WEBD * 3000/(1 << cycleNumber);
            let smallestReward = 0.00001;

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