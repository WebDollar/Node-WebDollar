import InterfaceSatoshminDB from 'common/satoshmindb/Interface-SatoshminDB';
import consts from 'consts/const_global';
import WebDollarCrypto from "common/crypto/WebDollar-Crypto";
import ed25519 from "common/crypto/ed25519";
import StatusEvents from "common/events/Status-Events"

import Utils from "common/utils/helpers/Utils";
import PoolsUtils from "common/mining-pools/common/Pools-Utils"

class MinerPoolSettings {

    constructor( minerPoolManagement, databaseName ){

        this.minerPoolManagement = minerPoolManagement;

        this._db = new InterfaceSatoshminDB( databaseName ? databaseName : consts.DATABASE_NAMES.MINER_POOL_DATABASE );

        this._minerPoolPrivateKey = WebDollarCrypto.getBufferRandomValues(64);
        this.minerPoolPublicKey = undefined;

        this._poolURL = '';
        this._poolsList = [];

        this.poolName = "";
        this.poolFee = 0;
        this.poolWebsite = "";
        this.poolDescription = "";
        this.poolServers = [];
        this.poolPublicKey = new Buffer(0);

    }

    async initializeMinerPoolSettings(poolURL){

        await this._getMinerPoolDetails();
        await this._getMinerPoolPrivateKey();

        if (poolURL !== undefined)
            this.setPoolURL(poolURL);

    }


    get poolURL(){
        return this._poolURL;
    }

    async setPoolURL(newValue, skipSaving = false){

        if (newValue === this._poolURL) return;

        if (!this.extractPoolURL(newValue))
            throw {message: "MinerPool: extract pool URL didn't work"};

        this._poolURL = newValue;

        if (!skipSaving)
            if (false === await this._db.save("pool_name", this._poolURL)) throw {message: "PoolURL couldn't be saved"};
    }



    extractPoolURL(url){

        let data = PoolsUtils.extractPoolURL(url);

        if (data === null) return null;

        this.poolName = data.poolName;
        this.poolFee = data.poolFee;
        this.poolWebsite = data.poolWebsite;
        this.poolDescription = data.poolDescription;
        this.poolPublicKey = data.poolPublicKey;
        this.poolServers = data.poolServers;

        this._emitPoolNotification();

        return true;
    }

    _emitPoolNotification(){

        StatusEvents.emit("miner-pool/newPoolURL", { poolName: this.poolName, poolFee: this.poolFee, poolWebsite: this.poolWebsite, poolServers: this.poolServers });

    }

    async saveMinerPoolPrivateKey(){

        let result = await this._db.save("minerPool_privateKey", this._minerPoolPrivateKey);

        return result;
    }

    async _getMinerPoolPrivateKey(){

        let savePrivateKey = false;
        this._minerPoolPrivateKey = await this._db.get("minerPool_privateKey", 30*1000, true);

        if (this._minerPoolPrivateKey === null) {
            this._minerPoolPrivateKey = ed25519.generatePrivateKey();
            savePrivateKey = true
        }

        if ( Buffer.isBuffer(this._minerPoolPrivateKey) )
            this.minerPoolPublicKey = ed25519.generatePublicKey(this._minerPoolPrivateKey);

        if (savePrivateKey)
            await this.saveMinerPoolPrivateKey();

        return this._minerPoolPrivateKey;
    }

    async _getMinerPoolDetails(){

        let poolURL = await this._db.get("minerPool_poolURL", 30*1000, true);

        await this.setPoolURL(poolURL, true);
    }

    minerPoolDigitalSign(message){

        let signature = ed25519.sign( message, this._minerPoolPrivateKey );
        return signature;

    }

    addPoolList(url){

        let data = PoolsUtils.extractPoolURL(url);

        let foundPool = this._findPoolList(url, data);
        if (foundPool !== null){
            foundPool = {};
            this._poolsList.push(foundPool);
        }

        foundPool.poolName = data.poolName;
        foundPool.poolAddress = data.poolAddress;
        foundPool.poolPublicKey = data.poolPublicKey;
        foundPool.poolServers = data.poolServers;
        foundPool.poolURL = data.poolURL;

    }

    _findPoolList(url, data){

        if (data === undefined)
            data = PoolsUtils.extractPoolURL(url);

        for (let i=0; i<this._poolsList; i++)
            if (this._poolsList[i].poolPublicKey.equals(data.poolPublicKey))
                return this._poolsList[i];

        return null;
    }

}

export default MinerPoolSettings;