import InterfaceSatoshminDB from 'common/satoshmindb/Interface-SatoshminDB';
const BigNumber = require('bignumber.js');

class PoolData {

    constructor(dataBase) {

        if (dataBase === undefined)
            this.db = new InterfaceSatoshminDB("poolDB");
        else
            this.db = dataBase;

        this._minersReward = [];

    }

    async saveMinersReward() {

        try{

            for (let i = 0; i < this._minersReward.length; ++i) {

                let minerReward = new BigNumber(this._minersReward[i].reward);
                let existingReward = await this.db.get(this._minersReward[i].address);

                if (existingReward !== null ) {
                    minerReward = minerReward.plus( new BigNumber(existingReward) );
                }

                await this.db.save(this._minersReward[i].address, minerReward.toString());
            }

        }
        catch (exception){

            console.log('ERROR saving miners reward in BD: ',  exception);

            return false;
        }
    }

    async setMinersReward(rewardList) {
        this._minersReward = rewardList;
    }

    async getMinersReward() {
        return this._minersReward;
    }

    /**
     *
     * @param minerAddress
     * @param reward
     * @returns {Promise<void>}
     */
    async increaseMinerReward(minerAddress, reward) {

        for (let i = 0; i < this._minersReward.length; ++i) {
            if (this._minersReward.address.equals(minerAddress)){
                this._minersReward[i].reward += reward;
                break;
            }
        }
    }

}

export default PoolData;