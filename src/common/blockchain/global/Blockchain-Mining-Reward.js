import WebDollarCoins from "common/utils/coins/WebDollar-Coins"

class BlockchainMiningReward{

    /**
     * Returns the entire distribution in WEBD sub-units including GENESIS(~9.9%)
     */
    getSumReward(height){

        if (typeof height !== "number")
            throw ('height is not defined');
        
        let entireGenesis = 4156801540; //4156801128;
        let minedDistributionAfterCycle = [0, 
            18921600000, 28382400000, 33112800000, 35478000000, 36660600000, 37251900000,
            37547550000, 37695375000, 37769287500, 37806243750, 37824721875, 37833960938,
            37838580469, 37840890234, 37842045117, 37842622559, 37842911279, 37843055640,
            37843127820, 37843163910, 37843181955, 37843190977, 37843195489, 37843197744,
            37843198872
        ];
        
        let blocksPerCycle = 6307200;
        let cycle = Math.trunc( height / blocksPerCycle );
        
        let sum = WebDollarCoins.WEBD * (entireGenesis + minedDistributionAfterCycle[cycle]) + 
                ( this.getReward(height) * (height % blocksPerCycle) );

        return sum;
    }

    /**
     * Returns the block[height]'s reward in WEBD sub-units
     */
    getReward(height){

        if (typeof height !== "number")
            throw ('height is not defined');

        let blocksPerCycle = 6307200;

        if (height >= 0){

            if (height <= 40) {
                return WebDollarCoins.WEBD * Math.trunc( 1949770302 / Math.pow(1.01645589, 41.5 * height - height * height / 2 - 41) );
            }
            else {

                let cycleNumber = Math.trunc( height / blocksPerCycle );
                let reward = WebDollarCoins.WEBD * 3000 / (1 << cycleNumber);
                let smallestReward = 1;

                if (reward < smallestReward)
                    reward = smallestReward;

                return reward;
            }
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