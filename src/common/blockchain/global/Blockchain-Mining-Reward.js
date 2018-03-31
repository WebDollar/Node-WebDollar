class BlockchainMiningReward{

    getReward(height){

        if (typeof height !== "number")
            throw ('height is not defined');

        if (height >= 0) {

            // ToDO - Budisteanu shift
            let cicleNumber = Math.trunc(height / 8409600);
            let reward = 2500/(1 << cicleNumber);
            let smallestReward = 0.0001;

            if (reward < smallestReward)
                reward = smallestReward;

            return reward;
        }

    }

}

export default new BlockchainMiningReward();