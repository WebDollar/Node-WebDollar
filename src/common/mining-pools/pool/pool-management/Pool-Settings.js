import InterfaceSatoshminDB from 'common/satoshmindb/Interface-SatoshminDB';
import consts from 'consts/const_global';
import WebDollarCrypto from "../../../crypto/WebDollar-Crypto";
import ed25519 from "common/crypto/ed25519";

import Utils from "common/utils/helpers/Utils";
import PoolsUtils from "common/mining-pools/common/Pools-Utils"
import Blockchain from "../../../../main-blockchain/Blockchain";

class PoolSettings {

    constructor(wallet, poolManagement, databaseName){

        this.poolManagement = poolManagement;
        this._wallet = wallet;
        this._db = new InterfaceSatoshminDB( databaseName ? databaseName : consts.DATABASE_NAMES.POOL_DATABASE );

        this._poolFee = 0.02;
        this._poolName = '';
        this._poolWebsite = '';
        this._poolServers = '';
        this._poolPOWValidationProbability = 0.10; //from 100

        this._poolPrivateKey = WebDollarCrypto.getBufferRandomValues(64);
        this.poolPublicKey = undefined;

        this.poolURL = '';

        //TODO: this stores the entire reward of pool(miners + poolLeader), this goes to Accountant Tree
        this._poolRewardsAddress = null;

        //TODO: this stores pool leader's reward, this goes to Accountant Tree
        this._poolLeaderRewardAddress = null;

    }

    async initializePoolSettings(poolFee){

        let result = await this._getPoolPrivateKey();
        result = result && await this._getPoolDetails();

        if (poolFee !== undefined)
            this.setPoolFee(poolFee);

        return result;

    }

    _generatePoolURL(){

        if (this._poolName === '' || this._poolFee === 0 ){
            this.poolURL = '';
            return '';
        }

        this.poolURL = 'https://webdollar.io/pool/'+encodeURI(this._poolName)+"/"+encodeURI(this.poolFee)+"/"+encodeURI(this.poolPublicKey.toString("hex"))+"/"+encodeURI(this.poolServers.join(";"));

        return this.poolURL;

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

    get poolPOWValidationProbability(){
        return this._poolPOWValidationProbability;
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

        this._poolPrivateKey = await this._db.get("pool_privateKey", 30*1000, true);

        if (this._poolPrivateKey === null) {

            let privateKey = await Blockchain.Wallet.addresses[0].getPrivateKey();
            this._poolPrivateKey = Buffer.concat( [ WebDollarCrypto.SHA256(WebDollarCrypto.MD5(privateKey)), WebDollarCrypto.SHA256( WebDollarCrypto.RIPEMD160(privateKey) )]);

        }

        if (Buffer.isBuffer(this._poolPrivateKey)){
            this.poolPublicKey = ed25519.generatePublicKey(this._poolPrivateKey);
        } else
            throw {message: "poolPrivateKey is wrong"}

        return true;
    }

    validatePoolDetails(){

        if (typeof this._poolName !== "string") throw {message: "pool name is not a string"};
        if (this._poolName !=='' && ! /^[A-Za-z\d\s]+$/.test(this._poolName)) throw {message: "pool name is invalid"};

        if ( typeof this._poolFee !== "number") throw {message: "pool fee is invalid"};
        if ( this._poolFee < 0 && this._poolFee > 1 ) throw {message: "pool fee is invalid"};

        if (typeof this._poolWebsite !== "string") throw {message: "pool website is not a string"};
        if (this._poolWebsite !== '' && ! Utils.validateUrl(this._poolWebsite)) throw {message:"pool website is invalid"};

        this._poolServers = PoolsUtils.processServersList( this.poolServers );

        this.poolManagement.poolProtocol.poolConnectedServersProtocol.insertServersListWaitlist( this._poolServers );

        this._generatePoolURL();

        if ( this.poolURL !== ''){ //start automatically
            this.poolManagement.startPool();
        }

    }

    async savePoolDetails(){

        this.validatePoolDetails();

        let result = await this._db.save("pool_name", this._poolName);
        result = result && await this._db.save("pool_fee", this._poolFee);
        result = result  && await this._db.save("pool_website", this._poolWebsite);
        result = result  && await this._db.save("pool_servers", JSON.stringify(this._poolServers));

        return  result;
    }

    async _getPoolDetails(){

        this._poolName = await this._db.get("pool_name", 30*1000, true);
        if (this._poolName === null) this._poolName = '';

        try {

            this._poolFee = await this._db.get("pool_fee", 30 * 1000, true);
            if (this._poolFee === null)
                this._poolFee = 0.02;

            this._poolFee = parseFloat(this._poolFee);
        } catch (exception){

        }

        this._poolWebsite = await this._db.get("pool_website", 30*1000, true);
        if (this._poolWebsite === null) this._poolWebsite = '';

        this._poolServers = JSON.parse( await this._db.get("pool_servers", 30*1000, true) );
        if (this._poolServers === null) this._poolServers = '';

        this.validatePoolDetails();


        return true;
    }

    poolDigitalSign(message){

        let signature = ed25519.sign( message, this._poolPrivateKey );
        return signature;

    }

}

export default PoolSettings;