var BigInteger = require('big-integer');
var BigNumber = require('bignumber.js');
import consts from 'consts/const_global'

class BlockchainDifficulty{

    static getDifficulty(getDifficultyCallback, getTimeStampCallback, blockTimestamp, blockNumber){

        // difficulty algorithm is based on blockNumber
        if (!( (typeof blockNumber === "number" && blockNumber >= 0) || (blockNumber instanceof BigInteger && blockNumber.isGreaterThanOrEqualTo(0))))
            throw "invalid block number";

        // console.log("prevBlockTimestamp", prevBlockTimestamp.toString(16));
        // console.log("blockTimestamp", blockTimestamp.toString(16));
        // console.log("blockNumber", blockNumber.toString(16));

        // try {
        //     console.warn("new difficulty mean", this.getDifficultyMean(getDifficultyCallback, getTimeStampCallback, blockTimestamp, blockNumber));
        // } catch (exception){
        //     console.error("couldn't calculate the getDifficultyMean for", blockNumber, exception);
        // }

        if (blockNumber < consts.BLOCKCHAIN.HARD_FORKS.TEST_NET_3.DIFFICULTY_HARD_FORK)
            return this.calculateBlockDifficultyETH(getDifficultyCallback, getTimeStampCallback, blockTimestamp, blockNumber);
        else
            return this.getDifficultyMean( getDifficultyCallback, getTimeStampCallback, blockTimestamp, blockNumber);

        // console.log("difficulty0",  rez.toString() );
        // console.log("difficulty1",  Serialization.serializeBigInteger( rez ).length, Serialization.serializeBigInteger( rez ) );
        // console.log("difficulty2", Serialization.serializeToFixedBuffer( 32, Serialization.serializeBigInteger( rez )).length, Serialization.serializeToFixedBuffer( 32, Serialization.serializeBigInteger( rez ) ));

    }

    /**
     * returns the Dificulty as a BigInteger
     * @param prevBlockDifficulty
     * @param prevBlockTimestamp
     * @param blockTimestamp
     * @param blockNumber
     * @param includeBombFormula
     */
    static calculateBlockDifficultyETH( getDifficultyCallback, getTimeStampCallback, blockTimestamp, blockNumber, includeBombFormula){

        // difficulty function based on Ethereum
        // https://ethereum.stackexchange.com/questions/5913/how-does-the-ethereum-homestead-difficulty-adjustment-algorithm-work


        /*
          block_diff = parent_diff + parent_diff // 2048 *
                       max(1 - (block_timestamp - parent_timestamp) // 10, -99) +
                       int(2**((block.number // 100000) - 2))                                                -- includeBombFormula
         */

        let prevBlockDifficulty = getDifficultyCallback(blockNumber);
        let prevBlockTimestamp = getTimeStampCallback(blockNumber);

        if (Buffer.isBuffer(prevBlockDifficulty))
            prevBlockDifficulty = BigInteger(prevBlockDifficulty.toString("hex"), 16);
        else if (typeof prevBlockDifficulty === "string") // it must be hex
            prevBlockDifficulty = BigInteger(prevBlockDifficulty.replace("0x",""), 16);


        if (Buffer.isBuffer(prevBlockTimestamp))
            prevBlockTimestamp = BigInteger(prevBlockTimestamp.toString("hex"), 16);
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

        let equationTwoPartA =  BigInteger(1).minus( blockTimestamp.minus( prevBlockTimestamp ).divide(10));    // max(1 - (block_timestamp - parent_timestamp) // 10, -99) +
        let equationTwo = equationTwoPartA.greater( -99 ) ? equationTwoPartA : -99;

        //console.log("equationTwo", equationTwo);

        let blockDiff;

        blockDiff = prevBlockDifficulty.minus(prevBlockDifficulty.divide(2048).times  //parent_diff + parent_diff // 2048 *
            (equationTwo)
        );

        if (blockDiff.lesser(0))
            return BigInteger("00148112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb", 16);
        else
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
    static getDifficultyMean( getDifficultyCallback, getTimeStampCallback, blockTimestamp, blockNumber){

        let prevBlockDifficulty = getDifficultyCallback(blockNumber);

        if (Buffer.isBuffer(prevBlockDifficulty))
            prevBlockDifficulty = new BigNumber("0x"+prevBlockDifficulty.toString("hex"));
        else if (typeof prevBlockDifficulty === "string") // it must be hex
            prevBlockDifficulty = new BigNumber(prevBlockDifficulty);

        //let's suppose BLOCKCHAIN.DIFFICULTY_NO_BLOCKS === 10
        //              blockNumber === 9
        // it should recalcule using [0...9]

        if ( (blockNumber+1) % consts.BLOCKCHAIN.DIFFICULTY_NO_BLOCKS !== 0)
            return BigInteger( prevBlockDifficulty.toString(16), 16 );
        else {

            console.warn("new difficulty mean recalculated", blockNumber);

            let how_much_it_should_have_taken_X_Blocks = consts.BLOCKCHAIN.DIFFICULTY_NO_BLOCKS * consts.BLOCKCHAIN.DIFFICULTY_TIME;
            let how_much_it_took_to_mine_X_Blocks = 0;

            //calculating 0, when blockNumber = 9
            let firstBlock = (blockNumber+1) - consts.BLOCKCHAIN.DIFFICULTY_NO_BLOCKS; // blockNumber is not included

            //adding 0..8
            for (let i = firstBlock; i < blockNumber; i++)
                how_much_it_took_to_mine_X_Blocks += getTimeStampCallback(i);

            //adding 9
            how_much_it_took_to_mine_X_Blocks += blockTimestamp;

            //It should substitute, the number of Blocks * Initial Block
            how_much_it_took_to_mine_X_Blocks -= (consts.BLOCKCHAIN.DIFFICULTY_NO_BLOCKS) * getTimeStampCallback(firstBlock);

            let ratio = new BigNumber(how_much_it_took_to_mine_X_Blocks).dividedBy(how_much_it_should_have_taken_X_Blocks);

            ratio = ratio.decimalPlaces(8);

            ratio = BigNumber.minimum( ratio, 10 );
            ratio = BigNumber.maximum( ratio, 0.01);

            console.warn("ratio2", ratio, ratio.toString());
            console.warn("how_much_it_should_have_taken_X_Blocks", how_much_it_should_have_taken_X_Blocks);
            console.warn("how_much_it_took_to_mine_X_Blocks", how_much_it_took_to_mine_X_Blocks);

            let newBlockDifficulty = prevBlockDifficulty.multipliedBy(ratio);
            newBlockDifficulty = newBlockDifficulty.decimalPlaces(0);

            console.warn("newBlockDifficulty2", newBlockDifficulty, newBlockDifficulty.toString(16));
            return BigInteger( newBlockDifficulty.toString(16), 16 );
            //return prevBlockDifficulty.multiply(ratio.toString());
        }

    }



}

export default BlockchainDifficulty;