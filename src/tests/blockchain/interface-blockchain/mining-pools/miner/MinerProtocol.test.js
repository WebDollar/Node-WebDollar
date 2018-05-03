const assert = require('assert');

import MinerProtocol from 'common/blockchain/interface-blockchain/mining-pools/miner/MinerProtocol';
import TestsHelper from 'tests/Tests.helper';


describe('test pool mining', () => {

    let minersList = [
        {
            address: "WEBD$gDDEDYafT8ur7EkSQzkVAZU4egSgEkH25#9TM3zKKN#Yj#eH@HsPw==",
            reward: 100,
            bestHash: TestsHelper.makeIdHex(32),
            difficulty: 0
        },
        {
            address: "WEBD$gD$q9AkZPN29xeHnuS$ykXHCqpv1@NT@R5yn4PkY#9bcxztwcDsPw==",
            reward: 201243,
            bestHash: TestsHelper.makeIdHex(32),
            difficulty: 0
        },
        {
            address: "WEBD$gCBzvQdKroa&yU4sp2X3y8*mf#q&r5k3BG3J3mBvogbE3U$SPHsPw==",
            reward: 3034556,
            bestHash: TestsHelper.makeIdHex(32),
            difficulty: 0
        },
    ];

    let response = null;

    it('test backbone mining block sample', async () => {
        //TODO: check if backbone mining works
        let miningFeeThreshold = 10;
        let poolData = undefined;
        let miner = new MinerProtocol(miningFeeThreshold, poolData);
        await miner.run();
        
    });


});

