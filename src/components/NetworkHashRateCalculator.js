import {BigNumber} from 'bignumber.js';

/**
 * Network HashRate Calculator
 */
class NetworkHashRateCalculator
{
    constructor(oBlockchain, maxTarget, blocksDifficultyIsRecalculated) {
        this._oBlockchain = oBlockchain;
        this._oMaxTarget  = maxTarget;
        this._nBlocksDifficultyIsRecalculated = blocksDifficultyIsRecalculated;
    }

    calculate() {
        let SumDiff = new BigNumber(0), last, first, i, diff;

        for (i = Math.max(0, this._oBlockchain.blocks.endingPosition - this._nBlocksDifficultyIsRecalculated); i < this._oBlockchain.blocks.endingPosition; i++)
        {
            if (typeof this._oBlockchain.blocks[i] === 'undefined')
            {
                continue;
            }

            diff    = this._oMaxTarget.dividedBy(new BigNumber('0x' + this._oBlockchain.blocks[i].difficultyTarget.toString('hex')));
            SumDiff = SumDiff.plus(diff);


            if (!first)
            {
                first = i;
            }

            last = i;
        }

        let howMuchItTookToMineXBlocks = this._oBlockchain.getTimeStamp(last) - this._oBlockchain.getTimeStamp(first);
        let answer = SumDiff.dividedToIntegerBy(new BigNumber(howMuchItTookToMineXBlocks.toString())).toFixed(13);

        return parseFloat(answer);
    }
}

export default NetworkHashRateCalculator;
