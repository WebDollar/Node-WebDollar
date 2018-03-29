var BigInteger = require('big-integer');
var BigNumber = require('bignumber.js');
import consts from 'consts/const_global'


class BlockchainDifficulty{

    static getDifficulty(getDifficultyCallback, getTimeStampCallback, blockTimestamp, blockNumber){

        // difficulty algorithm is based on blockNumber
        if (!( (typeof blockNumber === "number" && blockNumber >= 0) || (blockNumber instanceof BigInteger && blockNumber.isGreaterThanOrEqualTo(0))))
            throw {message: "invalid block number"};

        // console.log("prevBlockTimestamp", prevBlockTimestamp.toString(16));
        // console.log("blockTimestamp", blockTimestamp.toString(16));
        // console.log("blockNumber", blockNumber.toString(16));

        return this.getDifficultyMean( getDifficultyCallback, getTimeStampCallback, blockTimestamp, blockNumber);

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

        if (prevBlockTimestamp instanceof BigInteger === false)
            prevBlockTimestamp = BigInteger(prevBlockTimestamp);
        
        if (blockTimestamp instanceof BigInteger === false)
            blockTimestamp = BigInteger(blockTimestamp);
        
        if (blockNumber instanceof BigInteger === false)
            blockNumber = BigInteger(blockNumber);

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
     * like the difficulty used in BITCOIN based on the Last X Blocks
     *
     * every X Blocks,
     * newDiff = prevDifficulty * (how_much_it_should_have_taken_X_Blocks) / (how_much_it_took_to_mine_X_Blocks)
     *
     *
     * Issue #1: https://github.com/WebDollar/Node-WebDollar/issues/9
     *
     */


    static getDifficultyMean( getDifficultyCallback, getTimeStampCallback, blockTimestamp, blockNumber){

        let prevBlockDifficulty = getDifficultyCallback(blockNumber);

        if (Buffer.isBuffer(prevBlockDifficulty))
            prevBlockDifficulty = new BigNumber("0x"+prevBlockDifficulty.toString("hex"));
        else if (typeof prevBlockDifficulty === "string") // it must be hex
            prevBlockDifficulty = new BigNumber(prevBlockDifficulty);

        //let's suppose BLOCKCHAIN.DIFFICULTY.NO_BLOCKS === 10
        //              blockNumber === 9
        // it should recalcule using [0...9]

        if ( (blockNumber+1) % consts.BLOCKCHAIN.DIFFICULTY.NO_BLOCKS !== 0)
            return BigInteger( prevBlockDifficulty.toString(16), 16 );
        else {

            console.warn("new difficulty mean recalculated", blockNumber);

            let how_much_it_should_have_taken_X_Blocks = consts.BLOCKCHAIN.DIFFICULTY.NO_BLOCKS * consts.BLOCKCHAIN.DIFFICULTY.TIME_PER_BLOCK;
            let how_much_it_took_to_mine_X_Blocks = 0;

            // calculating 0, when blockNumber = 9
            // first block will start in 0
            let firstBlock = (blockNumber+1) - consts.BLOCKCHAIN.DIFFICULTY.NO_BLOCKS; // blockNumber is not included

            //adding blocks 0..8
            for (let i = firstBlock; i < blockNumber; i++) {
                how_much_it_took_to_mine_X_Blocks += getTimeStampCallback(i+1);
            }

            //adding block 9
            how_much_it_took_to_mine_X_Blocks += blockTimestamp;

            if ( how_much_it_took_to_mine_X_Blocks <= 0 )
                throw {message: "how_much_it_took_to_mine_X_Blocks is negative ", how_much_it_took_to_mine_X_Blocks: how_much_it_took_to_mine_X_Blocks};

            console.warn("blocktimestamp", blockTimestamp);
            console.warn("how_much_it_took_to_mine_X_Blocks ", how_much_it_took_to_mine_X_Blocks );

            //It should substitute, the number of Blocks * Initial Block
            how_much_it_took_to_mine_X_Blocks -= consts.BLOCKCHAIN.DIFFICULTY.NO_BLOCKS * getTimeStampCallback(firstBlock+1); //it will include 10*T

            /**
                block 0 => T
                block 1 => T+20
                block 2 => T+40
                block 3 => T+60
                block 4 => T+80
                block 5 => T+100
                block 6 => T+120
                block 7 => T+140
                block 8 => T+160
                block 9 => T+180

                so there will be (9*10/2)*20 sec
             **/
            how_much_it_took_to_mine_X_Blocks -= (consts.BLOCKCHAIN.DIFFICULTY.NO_BLOCKS-1)*consts.BLOCKCHAIN.DIFFICULTY.NO_BLOCKS/2 * consts.BLOCKCHAIN.DIFFICULTY.TIME_PER_BLOCK ; //it will include (9*10/2)*20 sec

            if ( how_much_it_took_to_mine_X_Blocks <= 0 )
                throw {message: "how_much_it_took_to_mine_X_Blocks is negative ", how_much_it_took_to_mine_X_Blocks:how_much_it_took_to_mine_X_Blocks };

            let ratio = new BigNumber(how_much_it_took_to_mine_X_Blocks).dividedBy(how_much_it_should_have_taken_X_Blocks);

            ratio = ratio.decimalPlaces(8);

            ratio = BigNumber.minimum(ratio, 8);
            ratio = BigNumber.maximum(ratio, 0.05);

            console.warn( "ratio2", ratio, ratio.toString() );
            console.warn( "how_much_it_should_have_taken_X_Blocks", how_much_it_should_have_taken_X_Blocks );
            console.warn( "how_much_it_took_to_mine_X_Blocks", how_much_it_took_to_mine_X_Blocks );

            let newBlockDifficulty = prevBlockDifficulty.multipliedBy(ratio);
            newBlockDifficulty = newBlockDifficulty.decimalPlaces(0);

            console.warn( "newBlockDifficulty2", newBlockDifficulty, newBlockDifficulty.toString(16) );
            console.warn( "newBlockDifficulty was calculated", Math.floor( new Date().getTime() / 1000), "    ", new Date() );
            return BigInteger( newBlockDifficulty.toString(16), 16 );
            //return prevBlockDifficulty.multiply(ratio.toString());
        }

    }



}

export default BlockchainDifficulty;