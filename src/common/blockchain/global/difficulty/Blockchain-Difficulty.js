import consts from 'consts/const_global';
import BlockchainGenesis from 'common/blockchain/global/Blockchain-Genesis';

let BigNumber = require ('bignumber.js');


class BlockchainDifficulty{

    static async getDifficulty(getDifficultyCallback, getTimeStampCallback, blockTimestamp, blockNumber){

        // difficulty algorithm is based on blockNumber
        if ( typeof blockNumber !== "number" )
            throw {message: "invalid block number"};

        //hard fork
        if (blockNumber <= consts.BLOCKCHAIN.HARD_FORKS.DIFFICULTY_REMOVED_CONDITION) {
            let diff = blockTimestamp - await getTimeStampCallback(blockNumber - 1);
            if (blockNumber > consts.BLOCKCHAIN.HARD_FORKS.DIFFICULTY_TIME_BIGGER && ( Math.abs(diff) <= consts.BLOCKCHAIN.DIFFICULTY.TIME_PER_BLOCK / 2 ))
                throw {message: "Blocks generated too fast"};
        }

        let prevBlockDifficulty = await getDifficultyCallback( blockNumber -1, true );
        if (consts.DEBUG)
            console.log("prevBlockDifficulty", blockNumber-1, BlockchainGenesis.isPoSActivated(blockNumber-1) ? "POS" :  "POW",  prevBlockDifficulty.toString("hex"));

        if (Buffer.isBuffer(prevBlockDifficulty)) prevBlockDifficulty = new BigNumber("0x"+prevBlockDifficulty.toString("hex")); else
        if (typeof prevBlockDifficulty === "string") prevBlockDifficulty = new BigNumber(prevBlockDifficulty); // it must be hex

        if ((blockNumber + 1) % consts.BLOCKCHAIN.DIFFICULTY.NO_BLOCKS !== 0)
            return prevBlockDifficulty;

        let difficulty, callback;
        if (BlockchainGenesis.isPoSActivated( blockNumber ))
            callback = this.getDifficultyMeanPOS;
        else
            callback = this.getDifficultyMeanPOW;

        difficulty = await callback ( prevBlockDifficulty, getTimeStampCallback, blockTimestamp, blockNumber);

        if (difficulty.isGreaterThan(consts.BLOCKCHAIN.BLOCKS_MAX_TARGET)) difficulty = consts.BLOCKCHAIN.BLOCKS_MAX_TARGET;
        if (difficulty.isLessThan(1) ) difficulty = new BigNumber(1);

        return difficulty;

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

    static async getDifficultyMeanPOW( prevBlockDifficulty, getTimeStampCallback, blockTimestamp, blockNumber){

        //let's suppose BLOCKCHAIN.DIFFICULTY.NO_BLOCKS === 10
        //              blockNumber === 9
        // it should recalculate using [0...9]

        let how_much_it_took_to_mine_X_Blocks = 0;

        // calculating 0, when blockNumber = 9
        // first block will start in 0
        let firstBlock = (blockNumber+1) - consts.BLOCKCHAIN.DIFFICULTY.NO_BLOCKS; // blockNumber is not included

        //avoid first Block, because the firstBlock is correlated with the last block of the POW
        if ( blockNumber >= consts.BLOCKCHAIN.HARD_FORKS.POS_ACTIVATION && (blockNumber+1) % 30 === 0)
            firstBlock +=1;

        //adding blocks 0..8
        for (let i = firstBlock; i < blockNumber; i++) {
            //the difference between Ti-(Ti-1) is actually the time for Ti
            how_much_it_took_to_mine_X_Blocks += await getTimeStampCallback(i ) - await getTimeStampCallback(i-1);
            //console.log("block ",i," timestamp ", getTimeStampCallback(i ), " time ", getTimeStampCallback(i ) - getTimeStampCallback(i-1) );
        }

        //adding block 9
        how_much_it_took_to_mine_X_Blocks += blockTimestamp - await getTimeStampCallback(blockNumber-1);
        let how_much_it_should_have_taken_X_Blocks = (blockNumber-firstBlock+1) * consts.BLOCKCHAIN.DIFFICULTY.TIME_PER_BLOCK;

        if(consts.DEBUG){
            console.log("block ",blockNumber," timestamp ", blockTimestamp, " time ", blockTimestamp - await getTimeStampCallback(blockNumber-1) );
            console.log("how_much_it_took_to_mine_X_Blocks ",how_much_it_took_to_mine_X_Blocks  );
        }

        if (blockNumber <= consts.BLOCKCHAIN.HARD_FORKS.DIFFICULTY_REMOVED_CONDITION && blockNumber < consts.BLOCKCHAIN.HARD_FORKS.POS_ACTIVATION) {
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

        return newBlockDifficulty;
    }

    static async getDifficultyMeanPOS( prevBlockDifficulty, getTimeStampCallback, blockTimestamp, blockNumber ){


        //let's suppose BLOCKCHAIN.DIFFICULTY.NO_BLOCKS === 10
        //              blockNumber === 9
        // it should recalcule using [0...9]


        let how_much_it_took_to_mine_X_Blocks = 0;

        // calculating 0, when blockNumber = 9
        // first block will start in 01
        let firstBlock = (blockNumber+1) - consts.BLOCKCHAIN.DIFFICULTY.NO_BLOCKS; // blockNumber is not included

        //avoid first Block, because the firstBlock is correlated with the last block of the POW
        if ((blockNumber+1) % 30 === 10)
            firstBlock +=1;

        //adding blocks 0..8
        for (let i = firstBlock; i < blockNumber; i++) {
            //the difference between Ti-(Ti-1) is actually the time for Ti
            how_much_it_took_to_mine_X_Blocks += await getTimeStampCallback(i ) - await getTimeStampCallback(i-1);
            //console.log("block ",i," timestamp ", getTimeStampCallback(i ), " time ", getTimeStampCallback(i ) - getTimeStampCallback(i-1) );
        }


        //adding block 9
        how_much_it_took_to_mine_X_Blocks += blockTimestamp - await getTimeStampCallback(blockNumber-1);
        let how_much_it_should_have_taken_X_Blocks = (blockNumber-firstBlock+1) * consts.BLOCKCHAIN.DIFFICULTY.TIME_PER_BLOCK;

        let ratio = new BigNumber(how_much_it_took_to_mine_X_Blocks).dividedBy(how_much_it_should_have_taken_X_Blocks);

        let min = 2;
        let max = 0.5;

        ratio = BigNumber.minimum(ratio, min );
        ratio = BigNumber.maximum(ratio, max  );

        if (Math.random() < 0.1)
            console.warn( how_much_it_should_have_taken_X_Blocks, "/", how_much_it_took_to_mine_X_Blocks );

        let newBlockDifficulty = prevBlockDifficulty.multipliedBy(ratio);
        newBlockDifficulty = newBlockDifficulty.decimalPlaces(0);


        return newBlockDifficulty
    }



}

export default BlockchainDifficulty;