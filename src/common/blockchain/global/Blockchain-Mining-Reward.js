import WebDollarCoins from "common/utils/coins/WebDollar-Coins"
import consts from "../../../consts/const_global";

class BlockchainMiningReward{

    constructor(){

        this.v = [1, 1867487789, 1007804769, 552321669, 307400655, 173745886, 99728963, 58133318,
            34413271, 20688253, 12630447, 7830882, 4930598, 3152722, 2047239, 1350046, 904119,
            614893, 424689, 297878, 212180, 153485, 112752, 84116, 63728, 49032, 38311, 30400,
            24497, 20047, 16660, 14061, 12051, 10490, 9272, 8323, 7588, 7025, 6604, 6306, 6113];

        this.blocksPerCycle = 3153600
        this.blocksPerCycle2Year = 1576800

    }

    /**
     * Returns the entire distribution in WEBD sub-units including GENESIS(~9.9%)
     */
    getSumReward(height){
        throw "not supported anymore. Math is required"
    }

    /**
     * Returns the block[height]'s reward in WEBD sub-units
     */
    _getReward(height){

        if (typeof height !== "number")
            throw {message: 'height is not defined'};

        if (height <= 40) {
            return this.v[height] * WebDollarCoins.WEBD;
        }
        else {

            let cycleNumber = Math.trunc( height / this.blocksPerCycle );
            let reward = WebDollarCoins.WEBD * 6000 / (1 << cycleNumber);

            return Math.max(1, reward )
        }

    }

    /**
     * Returns the block[height]'s reward in WEBD sub-units
     */
    _getRewardHalving(height){

        if (typeof height !== "number")
            throw {message: 'height is not defined'};

        height -= consts.BLOCKCHAIN.HARD_FORKS.HARD_FORKS


        const cycleNumber = Math.trunc( height / this.blocksPerCycle2Year ) + 1;

        const reward = WebDollarCoins.WEBD * 3000 / (1 << cycleNumber );

        return Math.max(1, reward )


    }

    getFinalReward(height){


        if (height <= consts.BLOCKCHAIN.HARD_FORKS.HARD_FORKS ){
            return this._getReward(height)
        } else {
            return this._getRewardHalving(height)
        }

    }

}

export default new BlockchainMiningReward();