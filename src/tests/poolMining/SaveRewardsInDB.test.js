var assert = require('assert');
const BigNumber = require('bignumber.js');

import InterfaceSatoshminDB from 'common/satoshmindb/Interface-SatoshminDB';
import SaveRewardsInDB from 'common/poolMining/SaveRewardsInDB';
import TestsHelper from 'tests/Tests.helper';

describe('test pool leader DB', (dataBase) => {

    let saveDataBase = new SaveRewardsInDB();

    if (dataBase === undefined)
        this.db = new InterfaceSatoshminDB("sew");
    else
        this.db = dataBase;

    let hashListTotalReward = 60;
    let hashList = [
        {
            address:"ad1",
            hash:TestsHelper.makeIdHex(32),
            reward:10,
            difficulty:0
        },
        {
            address:"ad2",
            hash:TestsHelper.makeIdHex(32),
            reward:20,
            difficulty:0
        },
        {
            address:"ad3",
            hash:TestsHelper.makeIdHex(32),
            reward:30,
            difficulty:0
        },
    ];

    it('reward update in DB', async ()=>{

        let DbTotalReward = new BigNumber(0);

        for (let i=0; i<hashList.length; i++){

            let currentReward = await this.db.get(hashList[i].address);
            DbTotalReward = DbTotalReward.plus(currentReward);

        }

        await saveDataBase.updateMinersReward(hashList);

        let total =  new BigNumber(0);

        for (let i=0; i<hashList.length; i++){

            let currentReward = await this.db.get(hashList[i].address);
            total = total.plus(currentReward);

        }

        DbTotalReward=DbTotalReward.toString();
        let totalDifference=total.minus(hashListTotalReward).toString();

        assert(totalDifference===DbTotalReward,"Correct saved");

    });

});

