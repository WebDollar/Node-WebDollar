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
        this.poolsList = {};

        this.poolName = "";
        this.poolFee = 0;
        this.poolWebsite = "";
        this.poolDescription = "";
        this.poolServers = [];
        this.poolPublicKey = new Buffer(0);

        this._minerPoolActivated = false;

    }

    async initializeMinerPoolSettings(poolURL){

        await this._getMinerPoolPrivateKey();
        await this._getMinerPoolList();

        await this._getMinerPoolDetails();

        if (poolURL !== undefined)
            await this.setPoolURL(poolURL);

    }


    get poolURL(){
        return this._poolURL;
    }

    async setPoolURL(newValue, skipSaving = false){

        if (newValue === this._poolURL) return;

        let data = PoolsUtils.extractPoolURL(newValue);
        if (data === null) throw {message: "poolURL is invalid"};

        this.poolName = data.poolName;
        this.poolFee = data.poolFee;
        this.poolWebsite = data.poolWebsite;
        this.poolDescription = data.poolDescription;
        this.poolPublicKey = data.poolPublicKey;

        await this.setPoolServers(data.poolServers);

        this._poolURL = newValue;

        await this.addPoolList(newValue, data);

        if (!skipSaving)
            if (false === await this._db.save("minerPool_poolURL", this._poolURL)) throw {message: "PoolURL couldn't be saved"};

        StatusEvents.emit("miner-pool/newPoolURL", { poolURL: this._poolURL, poolName: this.poolName, poolFee: this.poolFee, poolWebsite: this.poolWebsite, poolServers: this.poolServers, minerPoolActivated: this._minerPoolActivated });
        StatusEvents.emit("miner-pool/settings",   { poolURL: this._poolURL, poolName: this.poolName, poolFee: this.poolFee, poolWebsite: this.poolWebsite, poolServers: this.poolServers, minerPoolActivated: this._minerPoolActivated });

        return true;
    }

    async setPoolServers(newValue){

        PoolsUtils.validatePoolServers(newValue);

        if ( JSON.stringify(this.poolServers ) === JSON.stringify( newValue ) ) return;

        newValue = PoolsUtils.processServersList( newValue );
        this.poolServers = newValue;

        await this.minerPoolManagement.minerPoolProtocol.insertServersListWaitlist( this.poolServers );

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

        let poolMinerActivated = await this._db.get("minerPool_activated", 30*1000, true);

        if (poolMinerActivated === "true") poolMinerActivated = true;
        else if (poolMinerActivated === "false") poolMinerActivated = false;
        else if (poolMinerActivated === null) poolMinerActivated = false;

        PoolsUtils.validatePoolActivated(poolMinerActivated);


        await this.setPoolURL(poolURL, true);
        await this.setMinerPoolActivated(poolMinerActivated, true);
    }

    minerPoolDigitalSign(message){

        let signature = ed25519.sign( message, this._minerPoolPrivateKey );
        return signature;

    }

    async addPoolList(url, data){

        if (data === undefined)
            data = PoolsUtils.extractPoolURL(url);

        if (data === null) return;

        let foundPool = this.poolsList[data.poolPublicKey.toString("hex")];
        if (foundPool === undefined){
            foundPool = {};
            this.poolsList[data.poolPublicKey.toString("hex")] = foundPool;
        }

        foundPool.poolName = data.poolName;
        foundPool.poolFee = data.poolFee;
        foundPool.poolAddress = data.poolAddress;
        foundPool.poolPublicKey = data.poolPublicKey;
        foundPool.poolServers = data.poolServers;
        foundPool.poolWebsite = data.poolWebsite;
        foundPool.poolVersion = data.poolVersion;
        foundPool.poolURL = data.poolURL;

        await this._saveMinerPoolList();

    }

    async _saveMinerPoolList(){

        let result = await this._db.save("minerPool_poolsList", JSON.stringify( this.poolsList) );
        return result;

    }

    async _getMinerPoolList(){

        let result = JSON.parse ( await this._db.get("minerPool_poolsList", 30*1000, true) );

        this.poolsList = result;

        return result;
    }

    async setMinerPoolActivated(newValue, skipSaving = false){

        PoolsUtils.validatePoolActivated(newValue);

        this._minerPoolActivated = newValue;

        if (!skipSaving)
            if (false === await this._db.save("minerPool_activated", this._minerPoolActivated ? "true" : "false")) throw {message: "minerPoolActivated couldn't be saved"};

        StatusEvents.emit("miner-pool/settings",   { poolURL: this._poolURL, poolName: this.poolName, poolFee: this.poolFee, poolWebsite: this.poolWebsite, poolServers: this.poolServers, minerPoolActivated: this._minerPoolActivated });

        await this.minerPoolManagement.setMinerPoolStarted(newValue, true);
    }

    get minerPoolActivated(){
        return this._minerPoolActivated;
    }

}

export default MinerPoolSettings;