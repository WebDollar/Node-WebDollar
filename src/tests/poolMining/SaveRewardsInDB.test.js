var assert = require('assert');

import InterfaceSatoshminDB from 'common/satoshmindb/Interface-SatoshminDB';
import SaveRewardsInDB from 'common/poolMining/SaveRewardsInDB.js';

describe('test pool leader DB', (dataBase) => {

    let saveDataBase = new SaveRewardsInDB();

    if (dataBase === undefined)
        this.db = new InterfaceSatoshminDB("sew");
    else
        this.db = dataBase;

    let hashList = [
        {
            address:"ad1",
            hash:"00078112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb",
            reward:10,
            difficulty:0
        },
        {
            address:"ad2",
            hash:"00008112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb",
            reward:20,
            difficulty:0
        },
        {
            address:"ad3",
            hash:"00000112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb",
            reward:30,
            difficulty:0
        },
    ];

    it('handle reward update in DB', async ()=>{

        await saveDataBase.updateMinersReward(hashList);

        let total = 0;

        for (let i=0; i<hashList.length; i++){

            let currentReward = await this.db.get(hashList[i].address);
            total += currentReward;

        }

        assert(total > 0, "Wrong saved");

    });

});

