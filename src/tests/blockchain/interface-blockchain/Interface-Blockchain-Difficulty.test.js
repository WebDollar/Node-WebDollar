var BigInteger = require('big-integer');
var assert = require('assert')


import BlockchainDifficulty from 'common/blockchain/global/difficulty/Blockchain-Difficulty'
import Difficulty_ETH_DifficultyHomestead from './tests/Difficulty_ETH_DifficultyHomestead';


describe('test blockchain difficulty', () => {

    it('difficulty Ethereum test Homestead', ()=>{

        let index = 0;
        for (let difficultyTest in Difficulty_ETH_DifficultyHomestead){

            if (Difficulty_ETH_DifficultyHomestead.hasOwnProperty(difficultyTest)) {

                let difficulty = Difficulty_ETH_DifficultyHomestead[difficultyTest];
                let result = BlockchainDifficulty.calculateBlockDifficultyETH( BigInteger( difficulty.parentDifficulty.replace("0x",""), 16),  BigInteger(difficulty.parentTimestamp.replace("0x",""), 16), BigInteger(difficulty.currentTimestamp.replace("0x",""), 16), BigInteger(difficulty.currentBlockNumber.replace("0x",0), 16), true);

                let testOutputDifficult = BigInteger(difficulty.currentDifficulty.replace("0x",""), 16);

                assert(result.equals(testOutputDifficult), " difficulty failed test "+index+"    with numbers " + result.toString()+ " vs " + testOutputDifficult.toString())
            }

            index++;
        }

    });

});

