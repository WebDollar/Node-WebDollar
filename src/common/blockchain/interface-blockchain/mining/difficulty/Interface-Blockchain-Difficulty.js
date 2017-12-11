var BigNumber = require('bignumber.js');
var BigInteger = require('big-integer');

class InterfaceBlockchainDifficulty{

    getDifficulty(prevBlockDifficulty, prevBlockTimestamp, blockTimestamp, blockNumber){


        // difficulty algorithm is based on blockNumber


        if ( (typeof blockNumber === "number" && blockNumber >= 0) || (blockNumber instanceof BigInteger && blockNumber.greaterThanOrEqualTo(0)))
            return this.calculateBlockDifficultyETH(prevBlockDifficulty, prevBlockTimestamp, blockTimestamp, blockNumber);

        throw ('invalid block number')

    }

    /**
     * returns the Dificulty as a BigInteger
     * @param prevBlockDifficulty
     * @param prevBlockTimestamp
     * @param blockTimestamp
     * @param blockNumber
     * @param includeBombFormula
     */
    calculateBlockDifficultyETH(prevBlockDifficulty, prevBlockTimestamp, blockTimestamp, blockNumber, includeBombFormula){

        // difficulty function based on Ethereum
        // https://ethereum.stackexchange.com/questions/5913/how-does-the-ethereum-homestead-difficulty-adjustment-algorithm-work


        /*
          block_diff = parent_diff + parent_diff // 2048 *
                       max(1 - (block_timestamp - parent_timestamp) // 10, -99) +
                       int(2**((block.number // 100000) - 2))                                                -- includeBombFormula
         */


        if (! prevBlockDifficulty instanceof BigInteger) prevBlockDifficulty = BigInteger(prevBlockDifficulty);
        if (! prevBlockTimestamp instanceof BigInteger) prevBlockTimestamp = BigInteger(prevBlockTimestamp);
        if (! blockTimestamp instanceof BigInteger) blockTimestamp = BigInteger(blockTimestamp);
        if (! blockNumber instanceof BigInteger) blockNumber = BigInteger(blockNumber);

        let equationTwoPartA =  BigInteger(1).minus( blockTimestamp.minus( prevBlockTimestamp ).divide(10));    // max(1 - (block_timestamp - parent_timestamp) // 10, -99) +
        let equationTwo = equationTwoPartA.greater( -99 ) ? equationTwoPartA : -99;

        //console.log("equationTwo", equationTwo);

        let blockDiff = prevBlockDifficulty.add(  prevBlockDifficulty.divide(2048).times  //parent_diff + parent_diff // 2048 *
                                                    (equationTwo )
                                               );

        if (includeBombFormula)
            blockDiff = blockDiff.plus(  BigInteger(2).pow( blockNumber.divide(100000).minus(2)) )  //int(2**((block.number // 100000) - 2))

        return blockDiff;

    }

}

export default new InterfaceBlockchainDifficulty();