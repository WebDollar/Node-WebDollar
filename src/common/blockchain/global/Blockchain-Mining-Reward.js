import WebDollarCoins from "common/utils/coins/WebDollar-Coins"

class BlockchainMiningReward{

    /**
     * Returns the entire distribution in WEBD sub-units including GENESIS(~9.9%)
     */
    getSumReward(height){

        if (typeof height !== "number")
            throw {message: 'height is not defined'};
        
        let marketSupply = 4156801128;
        let minedDistributionAfterCycle = [0, 
            18921600000, 28382400000, 33112800000, 35478000000, 36660600000, 37251900000,
            37547550000, 37695375000, 37769287500, 37806243750, 37824721875, 37833960938,
            37838580469, 37840890234, 37842045117, 37842622559, 37842911279, 37843055640,
            37843127820, 37843163910, 37843181955, 37843190977, 37843195489, 37843197744,
            37843198872
        ];
        
        let blocksPerCycle = 6307200;// 3153600;
        let cycle = Math.trunc( height / blocksPerCycle );

        let sum = 0;


        if (height <= 40)
            for (let i = 0; i <= height; i++)
                sum += this.getReward(i);
        else {
            sum = WebDollarCoins.WEBD * (marketSupply + minedDistributionAfterCycle[cycle]) +
                ( this.getReward(height) * (height % blocksPerCycle) );

            if (height <= blocksPerCycle)
                sum -= 40 * this.getReward(height);
        }

        return sum;
    }

    /**
     * Returns the block[height]'s reward in WEBD sub-units
     */
    getReward(height){

        if (typeof height !== "number")
            throw {message: 'height is not defined'};

        let blocksPerCycle = 6307200; //3153600;


        if (height <= 40) {

            //return WebDollarCoins.WEBD * Math.trunc( 1949770302 / Math.pow(1.01645589, 41.5 * height - height * height / 2 - 41) );
            //return WebDollarCoins.WEBD * Math.trunc( 1867487789 / Math.pow(1.01554, 41.5 * height - height * height / 2 - 41) );

            // let v = [1, 1867487789, 1007804769, 552321669, 307400655, 173745886, 99728963, 58133318,
            //         34413271, 20688253, 12630447, 7830882, 4930598, 3152722, 2047239, 1350046, 904119,
            //         614893, 424689, 297878, 212180, 153485, 112752, 84116, 63728, 49032, 38311, 30400,
            //         24497, 20047, 16660, 14061, 12051, 10490, 9272, 8323, 7588, 7025, 6604, 6306, 6114];
            let v = [1, 1949770302, 1014943763, 537018249, 288818259, 157887877, 87732693, 49552169, 28448044,
                     16600864, 9846854, 5936806, 3638285, 2266361, 1434994, 923548, 604168, 401739, 271531, 186544,
                     130267, 92464, 66712, 48924, 36469, 27632, 21281, 16660, 13256, 10722, 8815, 7366, 6257, 5402,
                     4740, 4229, 3834, 3534, 3310, 3152, 3051];

            return v[height] * WebDollarCoins.WEBD;
        }
        else {

            let cycleNumber = Math.trunc( height / blocksPerCycle );
            //let reward = WebDollarCoins.WEBD * 6000 / (1 << cycleNumber);
            let reward = WebDollarCoins.WEBD * 3000 / (1 << cycleNumber);
            let smallestReward = 1;

            if (reward < smallestReward)
                reward = smallestReward;

            return reward;
        }

    }
    
    _getContinuousReward(height) {
        
        if (typeof height !== "number")
            throw {message: 'height is not defined'};

        if (height >= 0) {
            //TODO: implement continuous reward function
        }
        
    }

}

export default new BlockchainMiningReward();