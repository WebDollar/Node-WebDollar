import InterfaceSatoshminDB from 'common/satoshmindb/Interface-SatoshminDB';
import consts from 'consts/const_global';
import WebDollarCrypto from "../../../crypto/WebDollar-Crypto";
import ed25519 from "common/crypto/ed25519";

import Utils from "common/utils/helpers/Utils";
import PoolsUtils from "common/mining-pools/common/Pools-Utils"
import Blockchain from "main-blockchain/Blockchain";
import ed25519 from "common/crypto/ed25519";
import StatusEvents from "common/events/Status-Events";
import Log from 'common/utils/logging/Log';

class PoolSettings {

    constructor(wallet, poolManagement, databaseName){

        this.poolManagement = poolManagement;
        this._wallet = wallet;
        this._db = new InterfaceSatoshminDB( databaseName ? databaseName : consts.DATABASE_NAMES.POOL_DATABASE );

        this._poolFee = 0.02;
        this._poolName = '';
        this._poolWebsite = '';
        this._poolServers = [];
        this._poolPOWValidationProbability = 0.10; //from 100
        this._poolActivated = false;
        this._poolUseSignatures = false;
        this._poolUsePoolServers = true;

        this._poolReferralFee = 0;

        this._poolPrivateKey = WebDollarCrypto.getBufferRandomValues(64);
        this.poolPublicKey = new Buffer(0);
        this.poolAddress = '';

        this.poolURL = '';

    }

    async initializePoolSettings(poolFee){

        let result = await this._getPoolPrivateKey();
        result = result && await this._getPoolAddress();

        if (poolFee !== undefined )
            await this.setPoolFee(poolFee);

        result = result && await this._getPoolDetails();

        if (result)
            this.poolManagement.poolInitialized = true;

        return result;

    }
    
  printPoolSettings(showPoolPrivateKey=false){
  
      Log.info("Fee: " + this._poolFee, Log.LOG_TYPE.POOLS);
      Log.info("Referral Fee: " + this._poolReferralFee, Log.LOG_TYPE.POOLS);

      Log.info("Name: " + this._poolName, Log.LOG_TYPE.POOLS);
      Log.info("Website: " + this._poolWebsite, Log.LOG_TYPE.POOLS);

      let poolServersStr = "";
      for (let i = 0; i < this._poolServers.length; i++)
          poolServersStr += this._poolServers[i] + ", ";

      Log.info("Servers: {" + poolServersStr + "}");

      Log.info("POWValidationProbability: " + this._poolPOWValidationProbability, Log.LOG_TYPE.POOLS );
      Log.info("UsePoolServers: " + this._poolUsePoolServers, Log.LOG_TYPE.POOLS );
      Log.info("UsePoolSignatures: " + this._poolUseSignatures, Log.LOG_TYPE.POOLS );

      if (showPoolPrivateKey)
          Log.info("PrivateKey: " + this._poolPrivateKey.toString("hex"), Log.LOG_TYPE.POOLS );

      Log.info("PublicKey: " + this.poolPublicKey.toString("hex"), Log.LOG_TYPE.POOLS );
      Log.info("Address: " + this.poolAddress.toString("hex"), Log.LOG_TYPE.POOLS );
      Log.info("URL: " +this.poolURL, Log.LOG_TYPE.POOLS );
      Log.info("Activated: " + this._poolActivated, Log.LOG_TYPE.POOLS );
 }

    _generatePoolURL(){

        if (this._poolName === '' || this._poolFee === 0 || this._poolServers === [] ){
            this.poolURL = '';
            return '';
        }

        let servers = this.poolServers.join(";");
        servers = servers.replace(/\//g, '$' );

        let poolName = this.poolName.replace(/ /g,"_");

        this.poolURL =  ( process.env.BROWSER ? window.location.origin : 'http://webdollar.ddns.net:9094' ) +'/pool/1/'+encodeURI(poolName)+"/"+encodeURI(this.poolFee)+"/"+encodeURI(this.poolPublicKey.toString("hex"))+"/"+encodeURI(servers);
        StatusEvents.emit("pools/settings", { message: "Pool Settings were saved", poolName: this._poolName, poolServer: this._poolServers, poolFee: this._poolFee, poolWebsite: this._poolServers });

        return this.poolURL;

    }


    get poolName(){

        return this._poolName;
    }

    async setPoolName(newValue, skipSaving = false){

        if (this._poolName === newValue ) return;

        PoolsUtils.validatePoolName(newValue);

        this._poolName = newValue;

        if (!skipSaving)
            if (false === await this._db.save("pool_name", this._poolName)) throw {message: "PoolName couldn't be saved"};

        this._generatePoolURL();
    }

    get poolWebsite(){
        return this._poolWebsite;
    }

    get poolFee(){
        return this._poolFee;
    }

    async setPoolFee(newValue, skipSaving = false){

        if (this._poolFee === newValue) return;

        PoolsUtils.validatePoolFee(newValue);

        this._poolFee = newValue;

        if (!skipSaving)
            if (false === await this._db.save("pool_fee", this._poolFee)) throw {message: "PoolFee couldn't be saved"};

        this._generatePoolURL();
    }


    async setPoolWebsite(newValue, skipSaving = false){

        if (this._poolWebsite === newValue ) return;

        PoolsUtils.validatePoolWebsite(newValue);

        this._poolWebsite = newValue;

        if (!skipSaving)
            if (false === await await this._db.save("pool_website", this._poolWebsite)) throw {message: "PoolWebsite couldn't be saved"};

        this._generatePoolURL();
    }

    get poolPrivateKey(){

        return this._poolPrivateKey;
    }

    async setPoolActivated(newValue, skipSaving = false, useActivation = true){

        PoolsUtils.validatePoolActivated(newValue);

        this._poolActivated = newValue;

        if (!skipSaving)
            if (false === await this._db.save("pool_activated", this._poolActivated ? "true" : "false")) throw {message: "poolActivated couldn't be saved"};

        StatusEvents.emit("pools/settings", { message: "Pool Settings were saved", poolName: this._poolName, poolServer: this._poolServers, poolFee: this._poolFee, poolWebsite: this._poolServers, poolUsePoolServers: this._poolUsePoolServers  });

        if (useActivation)
            await this.poolManagement.setPoolStarted(newValue, true);

    }

    get poolActivated(){
        return this._poolActivated;
    }


    async setPoolUseSignatures(newValue, skipSaving = false){

        PoolsUtils.validatePoolActivated(newValue);

        this._poolUseSignatures = newValue;

        if (!skipSaving)
            if (false === await this._db.save("pool_use_signatures", this._poolUseSignatures ? "true" : "false")) throw {message: "poolUseSignatures couldn't be saved"};

    }

    get poolUseSignatures(){
        return this._poolUseSignatures;
    }


    async setPoolReferralFee(newValue, skipSaving = false){

        PoolsUtils.validatePoolFee(newValue);

        this._poolReferralFee = newValue;

        if (!skipSaving)
            if (false === await this._db.save("pool_referral_fee", this._poolReferralFee )) throw {message: "poolReferralFee couldn't be saved"};

    }

    get poolReferralFee(){
        return this._poolReferralFee;
    }



    async setPoolUsePoolServers(newValue, skipSaving = false){

        PoolsUtils.validatePoolActivated(newValue);

        this._poolUsePoolServers = newValue;

        if (!skipSaving)
            if (false === await this._db.save("pool_use_pool_servers", this._poolUsePoolServers ? "true" : "false")) throw {message: "poolUsePoolServers couldn't be saved"};

    }

    get poolUsePoolServers(){
        return this._poolUsePoolServers;
    }




    get poolPOWValidationProbability(){
        return this._poolPOWValidationProbability;
    }


    get poolServers(){
        return this._poolServers;
    }

    getPoolServersText(){
        if (typeof this._poolServers === "string" ) return this._poolServers;

        return PoolsUtils.convertServersList(this._poolServers);
    }

    async setPoolServers(newValue, skipSaving = false){

        PoolsUtils.validatePoolServers(newValue);

        if ( JSON.stringify(this._poolServers ) === JSON.stringify( newValue ) ) return;

        newValue = PoolsUtils.processServersList( newValue );
        this._poolServers = newValue;

        if (!skipSaving)
            if (false === await this._db.save("pool_servers", JSON.stringify(this._poolServers))) throw {message: "PoolServers couldn't be stored"};

        if (this.poolManagement.poolStarted)
            await this.poolManagement.poolProtocol.poolConnectedServersProtocol.insertServersListWaitlist( this._poolServers );

        this._generatePoolURL();

    }

    async savePoolPrivateKey(){

        let result = await this._db.save("pool_privateKey", this._poolPrivateKey);

        return result;
    }

    async _getPoolAddress(){

        this.poolAddress = Blockchain.Wallet.addresses[0].address;

        return true;
    }

    async _getPoolPrivateKey(){

        this._poolPrivateKey = await this._db.get("pool_privateKey", 30*1000, true);

        if (this._poolPrivateKey === null) {

            this._poolPrivateKey = ed25519.generatePrivateKey();
            await this.savePoolPrivateKey();

            // let privateKey = await Blockchain.Wallet.addresses[0].getPrivateKey();
            // let finalPrivateKey = Buffer.concat( [ WebDollarCrypto.SHA256(WebDollarCrypto.MD5(privateKey)), WebDollarCrypto.SHA256( WebDollarCrypto.RIPEMD160(privateKey) )]);
            //
            // this._poolPrivateKey = ed25519.generatePrivateKey(finalPrivateKey);

        }

        if (Buffer.isBuffer(this._poolPrivateKey)){
            this.poolPublicKey = ed25519.generatePublicKey(this._poolPrivateKey);
        } else
            throw {message: "poolPrivateKey is wrong"}

        return true;
    }

    async justValidatePoolDetails(poolName, poolFee, poolWebsite, poolServers, poolActivated, poolReferralFee){

        return PoolsUtils.validatePoolsDetails(poolName, poolFee, poolWebsite, this.poolAddress, this.poolPublicKey, poolServers, poolActivated, poolReferralFee);

    }

    async _getPoolDetails(){

        let poolName = await this._db.get("pool_name", 30*1000, true);
        if (poolName === null) poolName = '';

        let poolFee;
        try {

            poolFee = await this._db.get("pool_fee", 30 * 1000, true);
            if (poolFee === null)
                poolFee = 0.02;

            poolFee = parseFloat(poolFee);
        } catch (exception){

            poolFee = 0.02;

        }

        let poolWebsite = await this._db.get("pool_website", 30*1000, true);
        if (poolWebsite === null) poolWebsite = '';

        let poolServers = JSON.parse( await this._db.get("pool_servers", 30*1000, true) );
        if (poolServers === null) poolServers = '';

        let poolActivated = await this._db.get("pool_activated", 30*1000, true);
        if (poolActivated === null) poolActivated = false;
        poolActivated = false;

        if (poolActivated === "true") poolActivated = true;
        else if (poolActivated === "false") poolActivated = false;
        else if (poolActivated === null) poolActivated = false;

        let poolUsePoolServers = await this._db.get("pool_use_pool_servers", 30*1000, true);
        if (poolUsePoolServers === "true") poolUsePoolServers = true;
        else if (poolUsePoolServers === "false") poolUsePoolServers = false;
        else if (poolUsePoolServers === null) poolUsePoolServers = true;

        let poolUseSignatures = await this._db.get("pool_use_signatures",  30*1000, true);
        if (poolUseSignatures === "true") poolUseSignatures = true;
        else if (poolUseSignatures === "false") poolUseSignatures = false;
        else if (poolUseSignatures === null) poolUseSignatures = true;

        if (!poolUsePoolServers)
            poolUseSignatures = false;

        let poolReferralFee = await this._db.get("pool_referral_fee",  30*1000, true);
        if (poolReferralFee === null) poolReferralFee = 0.05; // 5%

        if (false === await this.justValidatePoolDetails(poolName, poolFee, poolWebsite, poolServers, poolActivated, poolReferralFee))
            return false;

        await this.setPoolName( poolName , true );
        await this.setPoolFee ( poolFee , true );
        await this.setPoolWebsite ( poolWebsite , true );
        await this.setPoolServers ( poolServers , true );
        await this.setPoolActivated( poolActivated , true , true);

        await this.setPoolUsePoolServers( poolUsePoolServers, true, true);
        await this.setPoolUseSignatures( poolUseSignatures, true , true);

        await this.setPoolReferralFee( poolReferralFee, true);

        return true;

    }

    poolDigitalSign(message){

        let signature = ed25519.sign( message, this._poolPrivateKey );
        return signature;

    }

}

export default PoolSettings;
