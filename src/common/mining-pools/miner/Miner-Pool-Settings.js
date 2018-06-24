import InterfaceSatoshminDB from 'common/satoshmindb/Interface-SatoshminDB';
import consts from 'consts/const_global';
import WebDollarCrypto from "common/crypto/WebDollar-Crypto";
import ed25519 from "common/crypto/ed25519";
import StatusEvents from "common/events/Status-Events"

import Utils from "common/utils/helpers/Utils";
import PoolsUtils from "common/mining-pools/common/Pools-Utils"

const sanitizer = require('sanitizer');

class MinerPoolSettings {

    constructor( minerPoolManagement, databaseName ){

        this.minerPoolManagement = minerPoolManagement;

        this._db = new InterfaceSatoshminDB( databaseName ? databaseName : consts.DATABASE_NAMES.MINER_POOL_DATABASE );

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

        await this._getMinerPoolPublicKey();
        await this._getMinerPoolList();

        if (poolURL !== undefined)
            await this.setPoolURL(poolURL);

        await this._getMinerPoolDetails();

    }


    get poolURL(){
        return this._poolURL;
    }


    async setPoolURL(newValue, skipSaving = false){

        newValue = sanitizer.sanitize(newValue);

        if (newValue === null || newValue === this._poolURL) return;

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

        if (this.minerPoolManagement.minerPoolStarted)
            await this.minerPoolManagement.minerPoolProtocol.insertServersListWaitlist( this.poolServers );

    }

    async _getMinerPoolPublicKey(){

        this.minerPoolPublicKey = await this._db.get("minerPool_publicKey", 30*1000, true);

        if (this.minerPoolPublicKey === null){
            this.minerPoolPublicKey = WebDollarCrypto.getBufferRandomValues(32);
            let result = await this._db.save("minerPool_publicKey", this.minerPoolPublicKey);
            return result;
        }

        return true;
    }

    async _getMinerPoolDetails(){

        let poolURL = await this._db.get("minerPool_poolURL", 30*1000, true);

        let poolMinerActivated = await this._db.get("minerPool_activated", 30*1000, true);

        if (poolMinerActivated === "true") poolMinerActivated = true;
        else if (poolMinerActivated === "false") poolMinerActivated = false;
        else if (poolMinerActivated === null) poolMinerActivated = false;

        PoolsUtils.validatePoolActivated(poolMinerActivated);


        await this.setPoolURL(poolURL, true);
        await this.setMinerPoolActivated(poolMinerActivated, true, false);

    }


    async addPoolList(url, data){

        if (data === undefined)
            data = PoolsUtils.extractPoolURL(url);

        if (data === null) return;

        let foundPool = this.poolsList[data.poolPublicKey.toString("hex")];
        if (foundPool === undefined)
            foundPool = {};

        if (JSON.stringify(this.poolsList[data.poolPublicKey.toString("hex")]) !== JSON.stringify(data)){
            this.poolsList[data.poolPublicKey.toString("hex")] = data;
            await this._saveMinerPoolList();
        }


    }

    async _saveMinerPoolList(){

        let result = await this._db.save("minerPool_poolsList", new Buffer( JSON.stringify( this.poolsList), "ascii") );
        return result;

    }

    async _getMinerPoolList(){

        let result = await this._db.get("minerPool_poolsList", 30*1000, true);

        if (result !== null){
            if (Buffer.isBuffer(result))
                result = result.toString("ascii");

            result = JSON.parse ( result);

            this.poolsList = result;
        } else
            this.poolsList = {};

        return result;
    }

    async setMinerPoolActivated(newValue, skipSaving = false, useActivation = true){

        if (newValue === this._minerPoolActivated) return ;

        PoolsUtils.validatePoolActivated(newValue);

        this._minerPoolActivated = newValue;

        if (!skipSaving)
            if (false === await this._db.save("minerPool_activated", this._minerPoolActivated ? "true" : "false")) throw {message: "minerPoolActivated couldn't be saved"};

        StatusEvents.emit("miner-pool/settings",   { poolURL: this._poolURL, poolName: this.poolName, poolFee: this.poolFee, poolWebsite: this.poolWebsite, poolServers: this.poolServers, minerPoolActivated: this._minerPoolActivated });

        if (useActivation)
            await this.minerPoolManagement.setMinerPoolStarted(newValue, true);

    }

    get minerPoolActivated(){
        return this._minerPoolActivated;
    }

}

export default MinerPoolSettings;