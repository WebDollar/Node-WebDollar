let assert = require('assert');

import BlockchainMiningReward from 'common/blockchain/global/Blockchain-Mining-Reward';
import WebDollarCoins from "common/utils/coins/WebDollar-Coins";

describe('RewardSimulator', () => {

    it('reward simulator test - general formula', ()=>{
        
        let TIME_PER_BLOCK = 40; //Number of seconds per block
        let MINING_YEARS = 100; //Number of total mining years
        let CYCLE_PERIOD = 4; //Cycle period in years
        let TOTAL_SUPPLY = 42000000000; //Total Supply WEBDs
        let GENESIS_PERCENT = 9.99 / 100; //9.99%
        let INITIAL_REWARD_PER_BLOCK = 6000;
        
        let GENESIS_SUPPLY = 4156801128; //TOTAL_SUPPLY * GENESIS_PERCENT;    
        let MINING_REWARD = TOTAL_SUPPLY - GENESIS_SUPPLY;
        
        let MINING_CYCLES = MINING_YEARS / CYCLE_PERIOD; //Number of cycles
        let BLOCKS_PER_CYCLE = (3600 / TIME_PER_BLOCK) * 24 * 365 * CYCLE_PERIOD; //blocks per cycle
        
        let REWARD_PER_CYCLE; // The reward per cycle: X + X/2 + X/4 + X/8 + ... + X/2^(N-1) === TOTAL_SUPPLY
        
        let MINED_SUPPPLY = 0.0;
        //first mining cycle mines >= half of total supply
        for (REWARD_PER_CYCLE = MINING_REWARD/2; REWARD_PER_CYCLE < MINING_REWARD; ++REWARD_PER_CYCLE) {
            MINED_SUPPPLY = 0.0;
            for (let i = 0; i < MINING_CYCLES; ++i)
                MINED_SUPPPLY += REWARD_PER_CYCLE / (1 << i);
            if (MINED_SUPPPLY >= MINING_REWARD)
                break;
        }
        
        let STARTING_REWARD = REWARD_PER_CYCLE / BLOCKS_PER_CYCLE;

        console.log("Blocks per cycle:", BLOCKS_PER_CYCLE);
        console.log("Total supply after " + MINING_YEARS + " :" + MINED_SUPPPLY);
        //console.log("Total reward per first cycle:", REWARD_PER_CYCLE);
        console.log("Blocks mined per cycle:", BLOCKS_PER_CYCLE);
        console.log("Starting reward:", STARTING_REWARD);
        //console.log("Total supply for Y years, CYCLE_PERIOD year cycle, T seconds per block, STARTING_REWARD starting reward: ~STARTING_REWARD*(3600/T)*24*365*4*2");
        //console.log("Simplified formula and more accurate(using 1.9999999403953552 instead of 2): 252288000 * STARTING_REWARD / T");
        
        STARTING_REWARD = 6000;
        let MINED_REWARD = 0.0;
        for (let i = 0; i < MINING_CYCLES; ++i){
            MINED_REWARD += (STARTING_REWARD * BLOCKS_PER_CYCLE) / (1 << i);
        }

        console.log("Mined reward starting with " + STARTING_REWARD + " is " + MINED_REWARD);
        console.log("Total supply starting with " + STARTING_REWARD + " is " + (MINED_REWARD + GENESIS_SUPPLY));
    });

    it('reward simulator test - particular formula', ()=>{

        let reward = 0;
        let smallestReward = 0.0001;
        let BLOCKS_PER_CYCLE = 3153600;
        for (let height = 41; height < BLOCKS_PER_CYCLE; height += 1024) {
            reward = BlockchainMiningReward.getReward(height) / WebDollarCoins.WEBD;
            assert(reward === 6000, "Wrong reward for bock " + height + ": " + reward.toString() + "!==3000");
        }

        //TODO Budisteanu Shifts
        for (let cycle = 1; cycle <= 25; ++cycle) {
            let height = cycle * (BLOCKS_PER_CYCLE) - 1;
            reward = BlockchainMiningReward.getReward(height) / WebDollarCoins.WEBD;
            let targetReward = 6000 / (1 << (cycle-1));

            if (targetReward < smallestReward) targetReward = smallestReward;
            assert(reward === targetReward, "Wrong reward for bock " + height + ": " + reward.toString() + "!==" + targetReward.toString());

            height = cycle * (BLOCKS_PER_CYCLE);
            reward = BlockchainMiningReward.getReward(height) / WebDollarCoins.WEBD;
            targetReward = 6000 / (1 << cycle);

            if (targetReward < smallestReward) targetReward = smallestReward;
            assert(reward === targetReward, "Wrong reward for bock " + height + ": " + reward.toString() + "!==" + targetReward.toString());
        }

    });
    
    it('reward simulator test - weekly reward reduction', ()=>{

        let TOTAL_SUPPLY = 42000000000;
        
        let GENESIS_PERCENT = 9.99 / 100; //9.99%
        let GENESIS_SUPPLY = TOTAL_SUPPLY * GENESIS_PERCENT;    
        
        let MINING_REWARD = TOTAL_SUPPLY - GENESIS_SUPPLY;
        let INITIAL_REWARD_PER_BLOCK = 6000;
        
        console.log("GENESIS_SUPPLY=", GENESIS_SUPPLY);
        console.log("MINING_REWARD=", MINING_REWARD);
        
        //BEGIN SIMUALTION
        let weeksPerYear = 52;
        let numWeeks = (365 * 100 + 25) / 7; //~ 52 * 100; 25 is from 366-day years
        let minedWebd = 0;
        let actualReward = INITIAL_REWARD_PER_BLOCK;
        let reducingFactor = 0.24 / 100; //every week we reduce the reward by 1%
        
        for (let i = 0; i < numWeeks; ++i) {
            minedWebd += actualReward * 3 * 60 * 24 * 7; //sum the current week's reward
            actualReward -= actualReward * reducingFactor; //reduce the reward per block with reducingFactor %
        }
        
        console.log("WEBD mined after 100 years=", minedWebd);
    });

});