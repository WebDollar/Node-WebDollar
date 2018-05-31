const assert = require('assert');

import InterfaceSatoshminDB from 'common/satoshmindb/Interface-SatoshminDB';
import PoolData from 'common/mining-pools/pool/pool-management/pool-data/Pool-Data';
import TestsHelper from 'tests/Tests.helper';

describe('test pool leader DB', () => {

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

        await pd.addMiner(minersList[0].address, minersList[0].reward);
        
        response = await pd.addMiner(minersList[0].address, minersList[0].reward);
        assert(response === false, "Miner inserted twice");
        
        let miner = pd.getMinersList()[0];
        
        assert(!PoolData.compareMiners(miner, minersList[0]), "Miners differ");

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

            await pd.addMiner(minersList[i].address, minersList[i].reward);
            pd.increaseMinerReward(minersList[i].address, 10133333);
        }

        for (let i = 0; i < minersList.length; ++i){

            let targetReward = minersList[i].reward + 10133333;
            let minerReward = pd.getMinerReward(minersList[i].address);
            assert(minerReward === targetReward, "Miner updateReward is wrong");
        }
        
        
        
    });

});

