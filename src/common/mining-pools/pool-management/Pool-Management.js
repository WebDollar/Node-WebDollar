import InterfaceSatoshminDB from 'common/satoshmindb/Interface-SatoshminDB';
import consts from 'consts/const_global'

class PoolManagement {

    constructor(wallet, databaseName){

        this._wallet = wallet;
        this._db = new InterfaceSatoshminDB(databaseName ? databaseName : consts.DATABASE_NAMES.POOL_DATABASE);

        this._poolName = '';
        this._poolURL = '';

        this._poolSecret = new Buffer(0);
        this._privateKey = new Buffer(64);

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

    set poolPrivatekey(){

        this._wallet._poolSecret();
        this._privateKey = 0;

    }

}

export default new PoolManagement();