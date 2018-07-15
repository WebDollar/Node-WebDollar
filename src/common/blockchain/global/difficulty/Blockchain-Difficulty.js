import consts from 'consts/const_global';

let BigInteger = require('big-integer');
let BigNumber = require ('bignumber.js');


class BlockchainDifficulty{

    static getDifficulty(getDifficultyCallback, getTimeStampCallback, blockTimestamp, blockNumber){

        // difficulty algorithm is based on blockNumber
        if ( typeof blockNumber !== "number" )
            throw {message: "invalid block number"};

        return this.getDifficultyMean( getDifficultyCallback, getTimeStampCallback, blockTimestamp, blockNumber);

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
        else
        if (typeof prevBlockDifficulty === "string") // it must be hex
            prevBlockDifficulty = new BigNumber(prevBlockDifficulty);

        //let's suppose BLOCKCHAIN.DIFFICULTY.NO_BLOCKS === 10
        //              blockNumber === 9
        // it should recalcule using [0...9]


        if (blockNumber <= consts.BLOCKCHAIN.HARD_FORKS.DIFFICULTY_REMOVED_CONDITION) {
            let diff = blockTimestamp - getTimeStampCallback(blockNumber);
            if (blockNumber > consts.BLOCKCHAIN.HARD_FORKS.DIFFICULTY_TIME_BIGGER && ( Math.abs(diff) <= consts.BLOCKCHAIN.DIFFICULTY.TIME_PER_BLOCK / 2 ))
                throw {message: "Blocks generated too fast"};
        }


        if ( (blockNumber+1) % consts.BLOCKCHAIN.DIFFICULTY.NO_BLOCKS !== 0)
            return  prevBlockDifficulty;
        else {

            let how_much_it_should_have_taken_X_Blocks = consts.BLOCKCHAIN.DIFFICULTY.NO_BLOCKS * consts.BLOCKCHAIN.DIFFICULTY.TIME_PER_BLOCK;
            let how_much_it_took_to_mine_X_Blocks = 0;

            // calculating 0, when blockNumber = 9
            // first block will start in 0
            let firstBlock = (blockNumber+1) - consts.BLOCKCHAIN.DIFFICULTY.NO_BLOCKS; // blockNumber is not included

            //adding blocks 0..8
            for (let i = firstBlock; i < blockNumber; i++) {
                //the difference between Ti-(Ti-1) is actually the time for Ti
                how_much_it_took_to_mine_X_Blocks += getTimeStampCallback(i + 1) - getTimeStampCallback(i);
            }


            //adding block 9
            how_much_it_took_to_mine_X_Blocks += blockTimestamp - getTimeStampCallback(blockNumber);


            if (blockNumber <= consts.BLOCKCHAIN.HARD_FORKS.DIFFICULTY_REMOVED_CONDITION) {
                if ( how_much_it_took_to_mine_X_Blocks <= (blockNumber <= consts.BLOCKCHAIN.HARD_FORKS.DIFFICULTY_TIME_BIGGER ? consts.BLOCKCHAIN.DIFFICULTY.TIME_PER_BLOCK : 5 * consts.BLOCKCHAIN.DIFFICULTY.TIME_PER_BLOCK ) )
                    throw { message: "how_much_it_took_to_mine_X_Blocks less than consts.BLOCKCHAIN.DIFFICULTY.TIME_PER_BLOCK", how_much_it_took_to_mine_X_Blocks: how_much_it_took_to_mine_X_Blocks };
            }


            let ratio = new BigNumber(how_much_it_took_to_mine_X_Blocks).dividedBy(how_much_it_should_have_taken_X_Blocks);

            ratio = ratio.decimalPlaces(8);

            let min = blockNumber <= consts.BLOCKCHAIN.HARD_FORKS.DIFFICULTY_TIME_BIGGER ? 8 : blockNumber <= consts.BLOCKCHAIN.HARD_FORKS.DIFFICULTY_REMOVED_CONDITION ? 2.3 : 2;

            let max = blockNumber <= consts.BLOCKCHAIN.HARD_FORKS.DIFFICULTY_TIME_BIGGER ? 0.05 : blockNumber <= consts.BLOCKCHAIN.HARD_FORKS.DIFFICULTY_REMOVED_CONDITION ?  0.15 : 0.4;

            ratio = BigNumber.minimum(ratio, min );
            ratio = BigNumber.maximum(ratio, max  );

            if (Math.random() < 0.1)
                console.warn( how_much_it_should_have_taken_X_Blocks, "/", how_much_it_took_to_mine_X_Blocks );

            let newBlockDifficulty = prevBlockDifficulty.multipliedBy(ratio);
            newBlockDifficulty = newBlockDifficulty.decimalPlaces(0);

            if (newBlockDifficulty.isGreaterThan(consts.BLOCKCHAIN.BLOCKS_MAX_TARGET))
                newBlockDifficulty = consts.BLOCKCHAIN.BLOCKS_MAX_TARGET;

            if (newBlockDifficulty.isLessThan(1) )
                newBlockDifficulty = new BigNumber(1);

            return newBlockDifficulty;
        }

    }



}

export default BlockchainDifficulty;