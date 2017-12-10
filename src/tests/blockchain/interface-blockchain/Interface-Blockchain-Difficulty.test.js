var BigNumber = require('bignumber.js');
var assert = require('assert')


import InterfaceBlockchainDifficulty from 'common/blockchain/interface-blockchain/mining/difficulty/Interface-Blockchain-Difficulty'
import Difficulty_ETH_DifficultyFrontier from './tests/Difficulty_ETH_DifficultyFrontier';

import WebDollarCryptoData from 'common/crypto/Webdollar-Crypto-Data'


describe('test blockchain difficulty', () => {

    it('difficulty Ethereum test', ()=>{

        for (let difficultyTest in Difficulty_ETH_DifficultyFrontier){

            if (Difficulty_ETH_DifficultyFrontier.hasOwnProperty(difficultyTest)) {

                let difficulty = Difficulty_ETH_DifficultyFrontier[difficultyTest];
                let result = InterfaceBlockchainDifficulty.getDifficulty( new BigNumber(difficulty.parentDifficulty, 16),  new BigNumber(difficulty.parentTimestamp, 16), new BigNumber(difficulty.currentTimestamp, 16), new BigNumber(difficulty.currentBlockNumber));

                let testOutputDifficult = new BigNumber(difficulty.currentDifficulty, 16);
                assert(result.equals(testOutputDifficult), " difficulty failed " + result.toString()+ " vs " + testOutputDifficult.toString())
            }

        }

    });

});

