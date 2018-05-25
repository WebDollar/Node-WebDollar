import InterfaceSatoshminDB from 'common/satoshmindb/Interface-SatoshminDB';
import consts from 'consts/const_global'

class PoolManagement {

    constructor(wallet, databaseName){

        this._wallet = wallet;
        this._db = new InterfaceSatoshminDB(databaseName ? databaseName : consts.DATABASE_NAMES.POOL_DATABASE);

        this._poolFee = '';
        this._poolName = '';
        this._poolURL = '';
        this._poolServers = '';

        this._poolSecret = new Buffer(0);
        this._poolPrivateKey = new Buffer(0);
    }

    async initializePoolManagement(){


        await this._getPoolSecret();
        await this._getPoolDetails();

        await this.setPoolPrivatekey( undefined );
    }

    get poolName(){
        return this._poolName;
    }

    setPoolName(newValue){
        this._poolName = newValue;
        return this._savePoolDetails();
    }

    get poolURL(){
        return this._poolURL;
    }

    setPoolURL(newValue){
        this._poolURL = newValue;
        return this._savePoolDetails();
    }

    get poolPrivateKey(){
        return this._poolPrivateKey;
    }

    get poolFee(){
        return this._poolFee;
    }

    setPoolFee(newValue){
        this._poolFee = newValue;
        return this._savePoolDetails();
    }

    get poolServers(){
        return this._poolServers;
    }

    setPoolServers(newValue){
        this._poolServers = newValue;
        return this._savePoolDetails();
    }

    async setPoolPrivatekey(newPoolSecret){

        if (newPoolSecret !== undefined && this._poolSecret !== newPoolSecret){

            this._poolSecret = Buffer.from( newPoolSecret ) ;
            await this._savePoolSecret();
        }

        let minerAddress = this._wallet.getMiningAddress();

        this._poolPrivateKey = await minerAddress.getMiningPoolPrivateKey(this._poolSecret);

    }

    async _savePoolSecret(){
        return await this._db.save("_poolSecret", this._poolSecret);
    }

    async _getPoolSecret(){
        this._poolSecret = await this._db.get("_poolSecret", 30*1000, true);
    }

    async _savePoolDetails(){
        let result = await this._db.save("_poolName", this._poolName);
        result = result  && await this._db.save("_poolFee", this._poolFee);
        result = result  && await this._db.save("_poolURL", this._poolURL);
        result = result  && await this._db.save("_poolServers", JSON.stringify(this._poolServers));
        return  result;
    }

    async _getPoolDetails(){
        this._poolName = await this._db.get("_poolName", 30*1000, true);
        this._poolFee = await this._db.get("_poolFee", 30*1000, true);
        this._poolURL = await this._db.get("_poolURL", 30*1000, true);
        this._poolServers = JSON.parse( await this._db.get("_poolServers", 30*1000, true) );
    }

}

export default PoolManagement;