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


    it('test edit miners', async () => {

        let pd = new PoolData();

        await pd.setMiner(minersList[0].address, minersList[0].reward);
        assert(!pd.compareMiners(pd.getMinersList()[0], minersList[0]), "Miners differ");

        response = await pd.removeMiner(minersList[0].address);
        assert(response === true, "Wrong when removing miner");
    });

});

