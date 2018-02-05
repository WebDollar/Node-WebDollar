var assert = require('assert');
const BigNumber = require('bignumber.js');

import InterfaceSatoshminDB from 'common/satoshmindb/Interface-SatoshminDB';
import PoolData from 'common/poolMining/PoolData';
import TestsHelper from 'tests/Tests.helper';

describe('test pool leader DB', () => {

    let saveDataBase = new PoolData();

    let db = new InterfaceSatoshminDB("poolDB");

    let hashListTotalReward = 60;
    let hashList = [
        {
            address: "ad1",
            hash: TestsHelper.makeIdHex(32),
            reward: 10,
            difficulty: 0
        },
        {
            address: "ad2",
            hash: TestsHelper.makeIdHex(32),
            reward: 20,
            difficulty: 0
        },
        {
            address: "ad3",
            hash: TestsHelper.makeIdHex(32),
            reward: 30,
            difficulty: 0
        },
    ];

    it('test reward update in DB', async () => {

        let dbTotalReward = new BigNumber(0);

        for (let i = 0; i < hashList.length; i++){

            let currentReward = await db.get(hashList[i].address);
            dbTotalReward = dbTotalReward.plus(currentReward);

        }

        await saveDataBase.updateMinersReward(hashList);

        let total =  new BigNumber(0);

        for (let i = 0; i < hashList.length; i++){

            let currentReward = await db.get(hashList[i].address);
            total = total.plus(currentReward);

        }

        dbTotalReward = dbTotalReward.toString();
        let totalDifference = total.minus(hashListTotalReward).toString();

        assert(totalDifference === dbTotalReward, "totalDifference differs from dbTotalReward:" + totalDifference + "!==" + dbTotalReward);

    });

});

