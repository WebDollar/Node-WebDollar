import InterfaceSatoshminDB from 'common/satoshmindb/Interface-SatoshminDB';
const BigNumber = require('bignumber.js');

class SaveRewardsInDB {

    constructor(dataBase) {

        if (dataBase === undefined)
            this.db = new InterfaceSatoshminDB("poolDB");
        else
            this.db = dataBase;

    }

    async updateMinersReward(list){

        try{

            for (let i=0; i<list.length; i++){

                let currentAddressRewardString = await this.db.get(list[i].address);

                if (currentAddressRewardString === null ) {

                    await this.db.save(list[i].address, list[i].reward.toString());

                }else{

                    let currentAddressReward = new BigNumber( currentAddressRewardString );
                    let updatedReward = currentAddressReward.plus(list[i].reward);

                    await this.db.save(list[i].address, updatedReward.toString());
                }

            }

        }
        catch (exception){

            console.log('ERROR saving miner reward in BD: ',  exception);
            throw exception;

        }

    }

}

export default SaveRewardsInDB;