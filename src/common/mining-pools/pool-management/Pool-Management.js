import InterfaceSatoshminDB from 'common/satoshmindb/Interface-SatoshminDB';
import consts from 'consts/const_global'

class PoolManagement {

    constructor(wallet, databaseName){

        this._wallet = wallet;
        this._db = new InterfaceSatoshminDB(databaseName ? databaseName : consts.DATABASE_NAMES.POOL_DATABASE);

        this._poolName = '';
        this._poolURL = '';

        this._poolSecret = this._getPoolSecret();
        this._poolPrivateKey = new Buffer(64);

    }

    get poolName(){
        return this._poolName;
    }

    set poolName(newValue){
        this._poolName = newValue;
    }

    get poolURL(){
        return this._poolURL;
    }

    set poolURL(newValue){
        this._poolURL = newValue;
    }

    get poolPrivateKey(){
        return this._privateKey;
    }

    async setPoolPrivatekey(newPoolSecret){

        if (newPoolSecret !== undefined && this._poolSecret !== newPoolSecret){

            this._poolSecret = Buffer.from( newPoolSecret ) ;
            this._savePoolSecret(this._poolSecret);
        }

        let minerAddress = this._wallet.getMiningAddress();

        this._poolPrivateKey = minerAddress.getMiningPoolPrivateKey(this._poolSecret);
        
    }

    async _savePoolSecret(poolSecret){

        try {
            let result = await this._db.save("_poolSecret", poolSecret);

            return  result;
        }
        catch(err) {
            return 'ERROR on SAVE privateKey: ' + err;
        }
    }

    async _getPoolSecret(){

        let buffer = await this._db.get("_poolSecret", 30*1000, true);

        return buffer;

    }

}

export default new PoolManagement();