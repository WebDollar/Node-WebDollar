var BigNumber = require('bignumber.js');
var assert = require('assert')


import InterfaceBlockchainDifficulty from 'common/blockchain/interface-blockchain/mining/difficulty/Interface-Blockchain-Difficulty'
import Difficulty_ETH_DifficultyFrontier from './tests/Difficulty_ETH_DifficultyFrontier';

import WebDollarCryptoData from 'common/crypto/Webdollar-Crypto-Data'


describe('test blockchain difficulty', () => {

    it('difficulty Ethereum test', ()=>{

        let index = 0;
        for (let difficultyTest in Difficulty_ETH_DifficultyFrontier){

            if (Difficulty_ETH_DifficultyFrontier.hasOwnProperty(difficultyTest)) {

                let difficulty = Difficulty_ETH_DifficultyFrontier[difficultyTest];
                let result = InterfaceBlockchainDifficulty.calculateBlockDifficultyETH( new BigNumber(difficulty.parentDifficulty, 16),  new BigNumber(difficulty.parentTimestamp, 16), new BigNumber(difficulty.currentTimestamp, 16), new BigNumber(difficulty.currentBlockNumber, 16), true);

                let testOutputDifficult = new BigNumber(difficulty.currentDifficulty, 16);

                //result = result.add(new BigNumber(index)); //the tests also add index,

                if (index === 490)
                    break;

                assert(result.equals(testOutputDifficult), " difficulty failed test "+index+"    with numbers " + result.toString()+ " vs " + testOutputDifficult.toString())
            }

            index++;
        }

    });

});

