var BigInteger = require('big-integer');
var BigNumber = require('bignumber.js');
import consts from 'consts/const_global'

class BlockchainDifficulty{

    constructor(blockchain){

        this.blockchain = blockchain;

    }

    getDifficultyMean(prevBlockDifficulty, prevBlocksTimestamps, blockTimestamp, blockNumber){
        let rez = this.getDifficultyMean(prevBlockDifficulty, prevBlocksTimestamps, blockTimestamp, blockNumber);
    }

    getDifficulty(prevBlockDifficulty, prevBlockTimestamp, blockTimestamp, blockNumber){

        // difficulty algorithm is based on blockNumber
        if (!( (typeof blockNumber === "number" && blockNumber >= 0) || (blockNumber instanceof BigInteger && blockNumber.greaterThanOrEqualTo(0))))
            throw "invalid block number";

        // console.log("prevBlockTimestamp", prevBlockTimestamp.toString(16));
        // console.log("blockTimestamp", blockTimestamp.toString(16));
        // console.log("blockNumber", blockNumber.toString(16));

        let rez = this.calculateBlockDifficultyETH(prevBlockDifficulty, prevBlockTimestamp, blockTimestamp, blockNumber);

        // console.log("difficulty0",  rez.toString() );
        // console.log("difficulty1",  Serialization.serializeBigInteger( rez ).length, Serialization.serializeBigInteger( rez ) );
        // console.log("difficulty2", Serialization.serializeToFixedBuffer( 32, Serialization.serializeBigInteger( rez )).length, Serialization.serializeToFixedBuffer( 32, Serialization.serializeBigInteger( rez ) ));
        return rez;


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

        if (Buffer.isBuffer(prevBlockDifficulty))
            prevBlockDifficulty = BigInteger(prevBlockDifficulty.toString("hex"), 16);
        else if (typeof prevBlockDifficulty === "string") // it must be hex
            prevBlockDifficulty = BigInteger(prevBlockDifficulty.replace("0x",""), 16);


        if (Buffer.isBuffer(prevBlockDifficulty))
            prevBlockDifficulty = BigInteger(prevBlockDifficulty.toString("hex"), 16);
        else if (typeof prevBlockTimestamp === "string")
            prevBlockTimestamp = BigInteger(prevBlockTimestamp.replace("0x",""), 16);

        if (Buffer.isBuffer(blockTimestamp))
            blockTimestamp = BigInteger(blockTimestamp.toString("hex"), 16);
        else
        if (typeof blockTimestamp === "string"){
            blockTimestamp = BigInteger(blockTimestamp.replace("0x",""), 16);
        }

        if (prevBlockTimestamp instanceof BigInteger === false) prevBlockTimestamp = BigInteger(prevBlockTimestamp);
        if (blockTimestamp instanceof BigInteger === false) blockTimestamp = BigInteger(blockTimestamp);
        if (blockNumber instanceof BigInteger === false) blockNumber = BigInteger(blockNumber);

        //console.log(blockTimestamp, prevBlockTimestamp)

        // if (blockNumber.greater(31924)) {
        //
        //     if (blockNumber.equals(31925)) {
        //         blockTimestamp = BigInteger(1);
        //     }
        //     prevBlockDifficulty = BigInteger("FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",16).minus(prevBlockDifficulty);
        // }

        let equationTwoPartA =  BigInteger(1).minus( blockTimestamp.minus( prevBlockTimestamp ).divide(10));    // max(1 - (block_timestamp - parent_timestamp) // 10, -99) +
        let equationTwo = equationTwoPartA.greater( -99 ) ? equationTwoPartA : -99;

        //console.log("equationTwo", equationTwo);

        if (blockNumber.equals(31925)) {
            blockNumber = BigInteger(1);
        }


        let blockDiff;

        // if (blockNumber < 31924)
            blockDiff = prevBlockDifficulty.minus(prevBlockDifficulty.divide(2048).times  //parent_diff + parent_diff // 2048 *
                (equationTwo)
            );
        // else
        // if (blockNumber >= 31924) // ETHEREUM ORIGINAL FORMULA
        //     blockDiff = prevBlockDifficulty.plus(prevBlockDifficulty.divide(2048).times  //parent_diff + parent_diff // 2048 *
        //         (equationTwo)
        //     );
        //
        // if (includeBombFormula)
        //     blockDiff = blockDiff.plus(  BigInteger(2).pow( blockNumber.divide(100000).minus(2)) )  //int(2**((block.number // 100000) - 2))
        //
        // if (blockNumber.lesser(31924) )
        //     return blockDiff;
        // else
        // if (blockNumber.equals(31924)) {
        //     return BigInteger("00098112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb", 16);
        // }
        // else
        //     //Adoption to Converge to 0 from Ethereum original Formula
        //     return BigInteger("FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",16).minus(blockDiff);

        if (blockDiff.lesser(0)) {
            return BigInteger("00148112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb", 16);
        }else
            return blockDiff;

    }

    /**
     * like on BITCOIN
     *
     * every X Blocks,
     * newDiff = prevDifficulty * (how_much_it_should_have_taken_X_Blocks) / (how_much_it_took_to_mine_X_Blocks)
     *
     */

    //newDifficulty
    getDifficultyMean(prevBlockDifficulty, prevBlocksTimestamps, blockTimestamp, blockNumber){

        if (Buffer.isBuffer(prevBlockDifficulty))
            prevBlockDifficulty = BigInteger(prevBlockDifficulty.toString("hex"), 16);
        else if (typeof prevBlockDifficulty === "string") // it must be hex
            prevBlockDifficulty = BigInteger(prevBlockDifficulty.replace("0x",""), 16);

        if (blockNumber % 10 !== 0) return prevBlockDifficulty;
        else {

            let how_much_it_should_have_taken_X_Blocks = consts.BLOCKCHAIN_DIFFICULTY_NO_BLOCKS * consts.BLOCKCHAIN_DIFFICULTY_TIME;
            let how_much_it_took_to_mine_X_Blocks = 0;

            for (let i = this.blockchain.blocks.length - 1 - consts.BLOCKCHAIN_DIFFICULTY_NO_BLOCKS; i < this.blockchain.blocks.length - 1; i++) {

                how_much_it_took_to_mine_X_Blocks += this.blockchain.getTimeStamp(i);

            }

            let ratio = new BigNumber(how_much_it_should_have_taken_X_Blocks).dividedBy(how_much_it_should_have_taken_X_Blocks).decimalPlaces(6);

            return prevBlockDifficulty.divide(ratio.toString());
        }

    }

}

export default BlockchainDifficulty;