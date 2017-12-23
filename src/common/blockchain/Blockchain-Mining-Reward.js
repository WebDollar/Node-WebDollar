class BlockchainMiningReward{

    getReward(height){

        if (typeof height !== "number") throw ('height is not defined')

        if (height >=0)
            return 50/(height+1);

    }

}

export default new BlockchainMiningReward();