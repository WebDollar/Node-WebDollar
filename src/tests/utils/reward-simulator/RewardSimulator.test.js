var assert = require('assert');

describe('RewardSimulator', () => {

    it('reward simulator test - general formula', ()=>{
        
        let T = 15; //Number of seconds per block
        let Y = 100; //Number of total mining years
        let TS = 50505050505; //Total Supply WEBDs
        let CP = 4; //Cycle period in years
        let N = Y / CP; //Number of cycles
        let MAX_REWARD = TS;
        let BPC = (3600 / T) * 24 * 365 * CP; //blocks per cycle
        let X; // The reward per cycle: X + X/2 + X/4 + X/8 + ... + X/2^(N-1) === TS
        
        //first mining cycle mines >= half of total supply
        for (X = TS/2; X < MAX_REWARD; ++X) {
            let sum = 0.0;
            for (let i = 0; i < N; ++i)
                sum += X / (1 << i);
            console.log("sum =", sum);
            if (sum >= TS)
                break;
        }
        
        let FIRST_REWARD = X / BPC;
        
        console.log("Total reward per first cycle is", X);
        console.log("Number of blocks mined per cycle is", BPC);
        console.log("First block's reward is", FIRST_REWARD);
        
        console.log("Block reward function is: ");
        
        FIRST_REWARD = 5500;
        let TOTALSUPPLY = 0.0;
        for (let i = 0; i < N; ++i){
            TOTALSUPPLY += (FIRST_REWARD * BPC) / (1 << i);
        }
        
        console.log("Total supply is", TOTALSUPPLY);
    });
    
    it('reward simulator test - particular formula', ()=>{

       
    });

});