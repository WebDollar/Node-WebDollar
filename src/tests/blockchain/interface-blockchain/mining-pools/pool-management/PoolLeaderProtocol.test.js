
const assert = require('assert');
const BigNumber = require('bignumber.js');

import PoolLeaderProtocol from 'common/blockchain/interface-blockchain/mining-pools/pool-management/PoolLeaderProtocol';
import TestsHelper from 'tests/Tests.helper';
import consts from 'consts/const_global';

describe('test pool leader protocol', () => {

    let targetHash = new Buffer("00098112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb", "hex" );
    
    let minersList = [
        {
            address: "WEBD$gDDEDYafT8ur7EkSQzkVAZU4egSgEkH25#9TM3zKKN#Yj#eH@HsPw==",
            reward: new BigNumber(100),
            bestHash: TestsHelper.makeIdHex(32),
            difficulty: 0
        },
        {
            address: "WEBD$gD$q9AkZPN29xeHnuS$ykXHCqpv1@NT@R5yn4PkY#9bcxztwcDsPw==",
            reward: new BigNumber(20.1243),
            bestHash: TestsHelper.makeIdHex(32),
            difficulty: 0
        },
        {
            address: "WEBD$gCBzvQdKroa&yU4sp2X3y8*mf#q&r5k3BG3J3mBvogbE3U$SPHsPw==",
            reward: new BigNumber(30.34556),
            bestHash: TestsHelper.makeIdHex(32),
            difficulty: 0
        },
    ];

    it('test generate hash difficulties', () => {
        
        let poolLeaderFee = 10;
        let poolLeader = new PoolLeaderProtocol(consts.DATABASE_NAMES.POOL_DATABASE, poolLeaderFee);
        let response = poolLeader.computeHashDifficulties();
        
        poolLeader.setBestHash(targetHash);

        //assert(response, "Wrong hash difficulties:" + response);

    });

    it('test create reward distribution', () => {

        /*let poolLeaderFee = 10;
        let miner = new PoolLeaderProtocol(consts.DATABASE_NAMES.POOL_DATABASE, poolLeaderFee);

        let respose = miner.rewardsDistribution(reward,leaderCommissionPercentage,hashList);

        assert(respose.poolLeaderReward === reward / leaderCommissionPercentage, "Bad Pool leader reward: " + respose.poolLeaderReward + "!==" + reward);

        let totalMinersReward = new BigNumber(respose.minnersReward[0].reward);

        for (let i = 0; i < respose.minnersReward.length; i++){

            totalMinersReward = totalMinersReward.plus(respose.minnersReward[i].reward);

        }

        assert(totalMinersReward === reward - respose.poolLeaderReward, "Bad miners reward distribution with " + totalMinersReward + " WEBD");
*/
    });

    it('test Budisteanu Formula', () => {

      /*  let bestHash = TestsHelper.makeIdHex(32);
        let numberHashedLastTime = 250;

        let respose = miner.getMinerReward(bestHash, targetHash, reward, numberHashedLastTime);
*/
    });

    it('test Budisteanu Formula simulating blockchain', () => {

        let numberOfFindedBlocks = 5;
        let numberOfCalls = 40;

        for (let i = 0; i < numberOfFindedBlocks.length; i++){

            let hashsNumberLastTime = 250;

            for (let j = 0; j < numberOfCalls.length; j++){

                let bestHash=TestsHelper.makeIdHex(32);

                let respose = miner.getMinerReward(bestHash,targetHash,reward,hashsNumberLastTime);

            }

            hashsNumberLastTime += 10;

        }

    });

});

