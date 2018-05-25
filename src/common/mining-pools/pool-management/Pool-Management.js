import InterfaceSatoshminDB from 'common/satoshmindb/Interface-SatoshminDB';
import consts from 'consts/const_global'
import WebDollarCrypto from "../../crypto/WebDollar-Crypto";
import ed25519 from "common/crypto/ed25519";

class PoolManagement {

    constructor(wallet, databaseName){

        this._wallet = wallet;
        this._db = new InterfaceSatoshminDB( databaseName ? databaseName : consts.DATABASE_NAMES.POOL_DATABASE );

        this._poolFee = '';
        this._poolName = '';
        this._poolWebsite = '';
        this._poolServers = '';

        this._poolPrivateKey = WebDollarCrypto.getBufferRandomValues(64);
        this._poolPublicKey = undefined;

    }

    async initializePoolManagement(){

        await this._getPoolDetails();
        await this._getPoolPrivateKey();

    }

    async generatePoolURL(){

        return 'https://webdollar.io/pool/'+this._poolName+"/"+this._poolPublicKey.toString("hex")+"/"+this.poolServers.join(";");

    }


    get poolName(){
        return this._poolName;
    }

    setPoolName(newValue){
        this._poolName = newValue;
        return this.savePoolDetails();
    }

    get poolWebsite(){
        return this._poolWebsite;
    }

    setPoolWebsite(newValue){
        this._poolWebsite = newValue;
        return this.savePoolDetails();
    }

    get poolPrivateKey(){
        return this._poolPrivateKey;
    }

    get poolFee(){
        return this._poolFee;
    }

    setPoolFee(newValue){
        this._poolFee = newValue;
        return this.savePoolDetails();
    }

    get poolServers(){
        return this._poolServers;
    }

    setPoolServers(newValue){
        this._poolServers = newValue;
        return this.savePoolDetails();
    }

    async savePoolPrivateKey(){
        let result = await this._db.save("pool_privatekey", this._poolPrivateKey);
        return result;
    }

    async _getPoolPrivateKey(){

        this._poolPrivateKey = await this._db.get("pool_privatekey", 30*1000, true);

        if (this._poolPrivateKey === null)
            this._poolPrivateKey = WebDollarCrypto.getBufferRandomValues( 64 );

        if (Buffer.isBuffer(this._poolPrivateKey)){
            this._poolPublicKey = ed25519.generatePublicKey(this._poolPrivateKey);
        }

        return this._poolPrivateKey;
    }

    async savePoolDetails(){

        let result = await this._db.save("pool_name", this._poolName);
        result = result  && await this._db.save("pool_fee", this._poolFee);
        result = result  && await this._db.save("pool_website", this._poolWebsite);
        result = result  && await this._db.save("pool_servers", JSON.stringify(this._poolServers));
        return  result;

    }

    async _getPoolDetails(){

        this._poolName = await this._db.get("pool_name", 30*1000, true);
        this._poolFee = await this._db.get("pool_fee", 30*1000, true);
        this._poolWebsite = await this._db.get("pool_website", 30*1000, true);
        this._poolServers = JSON.parse( await this._db.get("pool_servers", 30*1000, true) );

    }

}

export default PoolManagement;