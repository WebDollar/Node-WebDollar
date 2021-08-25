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
    getSumReward( initialHeight){

        if (typeof initialHeight !== "number")
            throw {message: 'height is not defined'};

        if (initialHeight > 145000000){
            throw {message: "the constants have to be calculated"}
        }

        let minedDistributionAfterCycle = [
            41568011280000 , 171045611280000 , 194697596280000 , 206523596280000 , 212436596280000 ,
            215385212280000 , 216851636280000 , 217576964280000 , 217939628280000 , 218113076280000 ,
            218191916280000 , 218223452280000 , 218239220280000 , 218254988280000 , 218270756280000 ,
            218286524280000 , 218302292280000 , 218318060280000 , 218333828280000 , 218349596280000 ,
            218365364280000 , 218381132280000 , 218396900280000 , 218412668280000 , 218428436280000 ,
            218444204280000 , 218459972280000 , 218475740280000 , 218491508280000 , 218507276280000 ,
            218523044280000 , 218538812280000 , 218554580280000 , 218570348280000 , 218586116280000 ,
            218601884280000 , 218617652280000 , 218633420280000 , 218649188280000 , 218664956280000 ,
            218680724280000 , 218696492280000 , 218712260280000 , 218728028280000 , 218743796280000 ,
            218759564280000 , 218775332280000 , 218791100280000 , 218806868280000 , 218822636280000 ,
            218838404280000 , 218854172280000 , 218869940280000 , 218885708280000 , 218901476280000 ,
            218917244280000 , 218933012280000 , 218948780280000 , 218964548280000 , 218980316280000 ,
            218996084280000 , 219011852280000 , 219027620280000 , 219043388280000 , 219059156280000 ,
            219074924280000 , 219090692280000 , 219106460280000 , 219122228280000 , 219137996280000 ,
            219153764280000 , 219169532280000 , 219185300280000 , 219201068280000 , 219216836280000 ,
            219232604280000 , 219248372280000 , 219264140280000 , 219279908280000 , 219295676280000 ,
            219311444280000 , 219327212280000 , 219342980280000 , 219358748280000 , 219374516280000 ,
            219390284280000 , 219406052280000 , 219421820280000 , 219437588280000 , 219453356280000 ,
            219469124280000 , 219484892280000 ,
        ];


        let blocksPerCycle, height, cycle ;
        if (initialHeight <= consts.BLOCKCHAIN.HARD_FORKS.FORCED_HALVING) {
            blocksPerCycle = this.blocksPerCycle
            height = initialHeight
            cycle = Math.trunc( height / blocksPerCycle );
        }
        else{
            blocksPerCycle = this.blocksPerCycle2Year
            height = initialHeight - consts.BLOCKCHAIN.HARD_FORKS.FORCED_HALVING
            cycle = Math.trunc( height / blocksPerCycle ) + 1;
            if (cycle > 1   ) {
                //cycle -=1
                if ( (height % blocksPerCycle) === blocksPerCycle-1 ) {
                    cycle += 1
                }
                height += 1
            }
        }

        let sum = 0;

        if (initialHeight <= 40)
            for (let i = 0; i <= initialHeight; i++)
                sum += this._getReward(i);
        else {

            sum = ( minedDistributionAfterCycle[cycle] ) +
                ( this.getFinalReward( initialHeight ) * ( height % blocksPerCycle) );

            if (initialHeight <= blocksPerCycle)
                sum -= 40 * this.getFinalReward( initialHeight );
        }

        return sum;
    }

    /**
     * Returns the block[height]'s reward in WEBD sub-units
     */
    _getReward(height){
        if (height <= 40) {
            return this.v[height] * WebDollarCoins.WEBD;
        }
        else {

            const cycleNumber = Math.min( 53, Math.trunc( height / this.blocksPerCycle ) + 1);
            let reward = 6000 / Math.pow(2, cycleNumber - 1 );

            const rewardFinal = Math.max(1, Math.floor(reward) )
            return WebDollarCoins.WEBD * rewardFinal
        }

    }

    /**
     * Returns the block[height]'s reward in WEBD sub-units
     */
    _getRewardHalving(height){

        height -= consts.BLOCKCHAIN.HARD_FORKS.FORCED_HALVING

        const cycleNumber = Math.min( 53, Math.trunc( height / this.blocksPerCycle2Year ) + 1);
        const reward = 3000 / Math.pow(2, cycleNumber  );

        const rewardFinal = Math.max(1, Math.floor(reward) )
        return WebDollarCoins.WEBD * rewardFinal
    }

    getFinalReward(height){

        if (typeof height !== "number")
            throw {message: 'height is not defined'};

        if (height <= consts.BLOCKCHAIN.HARD_FORKS.FORCED_HALVING )
            return this._getReward(height)
        else
            return this._getRewardHalving(height)

    }

}

export default new BlockchainMiningReward();