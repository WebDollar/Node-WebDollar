var assert = require('assert');

describe('RewardSimulator', () => {

    it('reward simulator test - general formula', ()=>{
        
        let T = 15; //Number of seconds per block
        let Y = 100; //Number of total mining years
        let TS = 100000000000; //Total Supply WEBDs
        let CP = 4; //Cycle period in years
        let N = Y / CP; //Number of cycles
        let MAX_REWARD = TS;
        let BPC = (3600 / T) * 24 * 365 * CP; //blocks per cycle
        let X; // The reward per cycle: X + X/2 + X/4 + X/8 + ... + X/2^(N-1) === TS
        
        let sum = 0.0;
        //first mining cycle mines >= half of total supply
        for (X = TS/2; X < MAX_REWARD; ++X) {
            sum = 0.0;
            for (let i = 0; i < N; ++i)
                sum += X / (1 << i);
            console.log("sum =", sum);
            if (sum >= TS)
                break;
        }
        
        let SR = X / BPC;
        
        console.log("Total supply:", sum);
        //console.log("Total reward per first cycle:", X);
        //console.log("Number of blocks mined per cycle:", BPC);
        console.log("Starting reward:", SR);
        console.log("Total supply for Y years, CP year cycle, T seconds per block, SR starting reward: ~SR*(3600/T)*24*365*4*2");
        console.log("Simplified formula and more accurate(using 1.9999999403953552 instead of 2): 252288000 * SR / T");
        
        SR = 2500;
        let TOTALSUPPLY = 0.0;
        for (let i = 0; i < N; ++i){
            TOTALSUPPLY += (SR * BPC) / (1 << i);
        }

        console.log("Total supply is", TOTALSUPPLY);
        
        console.log("Total supply is", SR*(3600/T)*24*365*4*1.9999999403953552);
    });
    
    it('reward simulator test - particular formula', ()=>{

       
    });

});