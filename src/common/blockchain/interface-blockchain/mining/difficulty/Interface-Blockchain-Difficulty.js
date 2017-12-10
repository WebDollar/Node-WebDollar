var BigNumber = require('bignumber.js');

class InterfaceBlockchainDifficulty{

    getDifficulty(prevBlockDifficulty, prevBlockTimestamp, blockTimestamp, blockNumber){


        // difficulty algorithm is based on blockNumber


        if ( (typeof blockNumber === "number" && blockNumber >= 0) || (blockNumber instanceof BigNumber && blockNumber.greaterThanOrEqualTo(0)))
            return this.calculateBlockDifficultyETH(prevBlockDifficulty, prevBlockTimestamp, blockTimestamp, blockNumber);

        throw ('invalid block number')

    }

    calculateBlockDifficultyETH(prevBlockDifficulty, prevBlockTimestamp, blockTimestamp, blockNumber, includeBombFormula){

        // difficulty function based on Ethereum
        // https://ethereum.stackexchange.com/questions/5913/how-does-the-ethereum-homestead-difficulty-adjustment-algorithm-work


        /*
          block_diff = parent_diff + parent_diff // 2048 *
                       max(1 - (block_timestamp - parent_timestamp) // 10, -99) +
                       int(2**((block.number // 100000) - 2))                                                -- includeBombFormula
         */


        if (! prevBlockDifficulty instanceof BigNumber) prevBlockDifficulty = BigNumber(prevBlockDifficulty);
        if (! prevBlockTimestamp instanceof BigNumber) prevBlockTimestamp = BigNumber(prevBlockTimestamp);
        if (! blockTimestamp instanceof BigNumber) blockTimestamp = BigNumber(blockTimestamp);
        if (! blockNumber instanceof BigNumber) blockNumber = BigNumber(blockNumber);

        let equationTwoPartA = new BigNumber(1).minus( blockTimestamp.minus( prevBlockTimestamp ).dividedToIntegerBy(10));    // max(1 - (block_timestamp - parent_timestamp) // 10, -99) +
        let equationTwo = equationTwoPartA.greaterThan( -99 ) ? equationTwoPartA : -99;

        console.log("equationTwo", equationTwo);

        let blockDiff = prevBlockDifficulty.add(  prevBlockDifficulty.dividedToIntegerBy(2048).times  //parent_diff + parent_diff // 2048 *
                                                    (equationTwo )
                                               );

        if (includeBombFormula)
            blockDiff = blockDiff.plus( new BigNumber(2).toPower( blockNumber.dividedToIntegerBy(100000).minus(2)).floor() )  //int(2**((block.number // 100000) - 2))

        return blockDiff;

    }

}

export default new InterfaceBlockchainDifficulty();