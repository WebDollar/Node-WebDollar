var BigNumber = require('bignumber.js');

class InterfaceBlockchainDifficulty{

    getDifficulty(prevBlockDifficulty, prevBlockTimestamp, blockTimestamp, blockNumber){


        // difficulty algorithm is based on blockNumber


        if ( (typeof blockNumber === "number" && blockNumber >= 0) || (blockNumber instanceof BigNumber && blockNumber.greaterThanOrEqualTo(0)))
            return this.calculateBlockDifficultyETH(prevBlockDifficulty, prevBlockTimestamp, blockTimestamp, blockNumber);

        throw ('invalid block number')

    }

    calculateBlockDifficultyETH(prevBlockDifficulty, prevBlockTimestamp, blockTimestamp, blockNumber){

        // difficulty function based on Ethereum
        // https://ethereum.stackexchange.com/questions/5913/how-does-the-ethereum-homestead-difficulty-adjustment-algorithm-work


        /*
          block_diff = parent_diff + parent_diff // 2048 *
                       max(1 - (block_timestamp - parent_timestamp) // 10, -99) +
                       int(2**((block.number // 100000) - 2))
         */


        if (! prevBlockDifficulty instanceof BigNumber) prevBlockDifficulty = BigNumber(prevBlockDifficulty);
        if (! prevBlockTimestamp instanceof BigNumber) prevBlockTimestamp = BigNumber(prevBlockTimestamp);
        if (! blockTimestamp instanceof BigNumber) blockTimestamp = BigNumber(blockTimestamp);

        let equationTwoPartA = blockTimestamp.minus( prevBlockTimestamp ).dividedToIntegerBy(10).negated();
        let equationTwo = equationTwoPartA.greaterThan( -99 ) ? equationTwoPartA : -99;

        let blockDiff = prevBlockDifficulty.add(  prevBlockDifficulty.dividedToIntegerBy(2048).times  //parent_diff + parent_diff // 2048 *
                                                    (equationTwo )
                                                )

        return blockDiff;

    }

}

export default new InterfaceBlockchainDifficulty();