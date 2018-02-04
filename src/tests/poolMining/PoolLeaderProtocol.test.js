
var assert = require('assert');
const BigNumber = require('bignumber.js');

import PoolLeaderProtocol from 'common/poolMining/PoolLeaderProtocol.js';


describe('test pool leader protocol', () => {

    let miner = new PoolLeaderProtocol();

    let targetHash = new Buffer("00978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb", "hex");
    let hashList = [
        {
            address:"ad1",
            hash:"00078112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb",
            reward:0,
            difficulty:0
        },
        {
            address:"ad1",
            hash:"00008112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb",
            reward:0,
            difficulty:0
        },
        {
            address:"ad1",
            hash:"00000112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb",
            reward:0,
            difficulty:0
        },
    ];

    it('generate hash dificulties', ()=>{

        let respose = miner.generateHashDificulties(targetHash,hashList);

        assert(respose[0].difficulty<respose[1].difficulty<respose[2].difficulty,"Correct hash difficulties");

    });

    it('create reward distribution', ()=>{

        let reward = 2500;
        let leaderCommissionPercentage = 10;
        let respose = miner.rewardsDistribution(reward,leaderCommissionPercentage,hashList);

        assert(respose.poolLeaderReward==reward/leaderCommissionPercentage,"Good Pool leader reward");

        let reward0 = new BigNumber(respose.minnersReward[0].reward);
        let reward1 = new BigNumber(respose.minnersReward[1].reward);
        let reward2 = new BigNumber(respose.minnersReward[2].reward);
        let totalMinersReward = reward0.plus(reward1).plus(reward2);

        assert(totalMinersReward==reward-respose.poolLeaderReward,"Good minners reward distribution with "+totalMinersReward+ " WEBD");

    });


});

