import Serialization from "common/utils/Serialization";
import BufferExtended from "common/utils/BufferExtended"

var BigInteger = require('big-integer');

class BlockchainDifficulty{

    getDifficulty(prevBlockDifficulty, prevBlockTimestamp, blockTimestamp, blockNumber){


        // difficulty algorithm is based on blockNumber
        // console.log("prevBlockDifficulty", prevBlockDifficulty.length, prevBlockDifficulty);

        if ( (typeof blockNumber === "number" && blockNumber >= 0) || (blockNumber instanceof BigInteger && blockNumber.greaterThanOrEqualTo(0))) {

            // if (Buffer.isBuffer(prevBlockDifficulty))
            //     console.log(prevBlockDifficulty.toString("hex"));
            // else
            //     console.log(prevBlockDifficulty.toString());
            // console.log("prevBlockTimestamp", prevBlockTimestamp.toString(16));
            // console.log("blockTimestamp", blockTimestamp.toString(16));
            // console.log("blockNumber", blockNumber.toString(16));

            let rez = this.calculateBlockDifficultyETH(prevBlockDifficulty, prevBlockTimestamp, blockTimestamp, blockNumber);

            // console.log("difficulty0",  rez.toString() );
            // console.log("difficulty1",  Serialization.serializeBigInteger( rez ).length, Serialization.serializeBigInteger( rez ) );
            // console.log("difficulty2", Serialization.serializeToFixedBuffer( 32, Serialization.serializeBigInteger( rez )).length, Serialization.serializeToFixedBuffer( 32, Serialization.serializeBigInteger( rez ) ));
            return rez;
        }

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

        if (typeof prevBlockDifficulty === "string"){ // it must be hex
            prevBlockDifficulty.replace("0x","");
            prevBlockDifficulty = BigInteger(prevBlockDifficulty, 16);
        } else if (Buffer.isBuffer(prevBlockDifficulty)){
            prevBlockDifficulty = BigInteger(prevBlockDifficulty.toString("hex"), 16);
        }


        if (typeof prevBlockTimestamp === "string"){
            prevBlockTimestamp.replace("0x",""); //it must be hex
            prevBlockTimestamp = BigInteger(prevBlockTimestamp, 16);
        } else if (Buffer.isBuffer(prevBlockDifficulty)){
            prevBlockDifficulty = BigInteger(prevBlockDifficulty.toString("hex"), 16);
        }

        if (typeof blockTimestamp === "string"){
            blockTimestamp.replace("0x",""); //it must be hex
            blockTimestamp = BigInteger(blockTimestamp, 16);
        } else if (Buffer.isBuffer(blockTimestamp)){
            blockTimestamp = BigInteger(blockTimestamp.toString("hex"), 16);
        }


        if (prevBlockTimestamp instanceof BigInteger === false) prevBlockTimestamp = BigInteger(prevBlockTimestamp);
        if (blockTimestamp instanceof BigInteger === false) blockTimestamp = BigInteger(blockTimestamp);
        if (blockNumber instanceof BigInteger === false) blockNumber = BigInteger(blockNumber);

        //console.log(blockTimestamp, prevBlockTimestamp)

        let equationTwoPartA =  BigInteger(1).minus( blockTimestamp.minus( prevBlockTimestamp ).divide(10));    // max(1 - (block_timestamp - parent_timestamp) // 10, -99) +
        let equationTwo = equationTwoPartA.greater( -99 ) ? equationTwoPartA : -99;

        //console.log("equationTwo", equationTwo);

        //ethereum changed from .plus to .minus

        let blockDiff = prevBlockDifficulty.minus(  prevBlockDifficulty.divide(2048).times  //parent_diff + parent_diff // 2048 *
                                                    (equationTwo )
                                               );

        if (includeBombFormula)
            blockDiff = blockDiff.plus(  BigInteger(2).pow( blockNumber.divide(100000).minus(2)) )  //int(2**((block.number // 100000) - 2))

        return blockDiff;

    }

}

export default new BlockchainDifficulty();