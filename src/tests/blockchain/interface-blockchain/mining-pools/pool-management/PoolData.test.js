const assert = require('assert');
const BigNumber = require('bignumber.js');

import InterfaceSatoshminDB from 'common/satoshmindb/Interface-SatoshminDB';
import PoolData from 'common/blockchain/interface-blockchain/mining-pools/pool-management/PoolData';
import TestsHelper from 'tests/Tests.helper';

describe('test pool leader DB', () => {

    let minersList = [
        {
            address: "WEBD$gDDEDYafT8ur7EkSQzkVAZU4egSgEkH25#9TM3zKKN#Yj#eH@HsPw==",
            reward: new BigNumber(100),
            hash: TestsHelper.makeIdHex(32),
            difficulty: 0
        },
        {
            address: "WEBD$gD$q9AkZPN29xeHnuS$ykXHCqpv1@NT@R5yn4PkY#9bcxztwcDsPw==",
            reward: new BigNumber(20.1243),
            hash: TestsHelper.makeIdHex(32),
            difficulty: 0
        },
        {
            address: "WEBD$gCBzvQdKroa&yU4sp2X3y8*mf#q&r5k3BG3J3mBvogbE3U$SPHsPw==",
            reward: new BigNumber(30.34556),
            hash: TestsHelper.makeIdHex(32),
            difficulty: 0
        },
    ];

    let response = null;

    it('test save/load minersList to/from DB', async () => {

        let pd = new PoolData();

        response = await pd.saveMinersList();
        assert(response === true, "Error saving empty minersList: " + response);

        response = await pd.loadMinersList();
        assert(response === true, "Error loading empty minersList: " + response);

        pd.setMinersList(minersList);
        response = await  pd.saveMinersList();
        assert(response === true, "Error saving minersList: " + response);

        response = await  pd.loadMinersList();
        assert(response === true, "Error loading minersList: " + response);

        assert(!pd.compareMinersList(minersList), "minersList differ!");
    });


    it('test set/remove miners', async () => {

        let pd = new PoolData();

        await pd.setMiner(minersList[0].address, minersList[0].reward);
        
        response = await pd.setMiner(minersList[0].address, minersList[0].reward);
        assert(response === false, "Miner inserted twice");
        
        let miner = pd.getMinersList()[0];
        
        assert(!pd.compareMiners(miner, minersList[0]), "Miners differ");

        response = await pd.removeMiner(miner.address);
        assert(response === true, "Wrong when removing miner");
        
        response = await pd.removeMiner(miner.address);
        assert(response === false, "Miner found after delete!!!");
        
        response = pd.getMinersList();
        assert(response.length === 0, "minersList is not empty after removing the only one existing item:" + response.length);
    });
    
    it('test update miners reward', async () => {
        
        let pd = new PoolData();
        
        for (let i = 0; i < minersList.length; ++i){

            await pd.setMiner(minersList[i].address, minersList[i].reward);
            pd.increaseMinerReward(minersList[i].address, new BigNumber(10.133333));
        }

        for (let i = 0; i < minersList.length; ++i){

            let targetReward = minersList[i].reward.plus(new BigNumber(10.133333));
            let minerReward = pd.getMinerReward(minersList[i].address);
            assert(minerReward.equals(targetReward), "Miner updateReward is wrong");
        }
        
        
        
    });

});

