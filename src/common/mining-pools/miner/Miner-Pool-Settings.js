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

    setPoolURL(newValue){

        this._poolURL = newValue;

        if (!this.extractPoolURL())
            throw {message: ""}

        return this.saveMinerPoolDetails();
    }

    extractPoolURL(){

        this.poolName = "";
        this.poolFee = 0;
        this.poolWebsite = "";
        this.poolDescription = "";
        this.poolPublicKey = new Buffer(0);
        this.poolServers = [];

        if ( this._poolURL === null || this._poolURL === "" || this._poolURL === undefined ) return this._emitPoolNotification();


        let url = this._poolURL;

        let search = url;

        let poolName = search.substr(0, search.indexOf( "/" ));
        search = search.substr(search.indexOf( "/" )+1);

        let poolFee = search.substr(0, search.indexOf( "/" ));
        search = search.substr(search.indexOf( "/" )+1);

        let poolPublicKey = search.substr(0, search.indexOf( "/" ));
        search = search.substr(search.indexOf( "/" )+1);

        poolPublicKey = new Buffer(poolPublicKey, "hex");

        let poolWebsite = search.substr( 0, search.indexOf( "/" )).replace(/@/g, '/' );
        search = search.substr(search.indexOf( "/" )+1);

        let poolServers = search.replace(/@/g, '/' ).split(";");

        if (!PoolsUtils.validatePoolsDetails(poolName, poolFee, poolWebsite, poolPublicKey, poolServers)) throw {message: "validate pools "};

        this.poolName = poolName;
        this.poolFee = poolFee;
        this.poolWebsite = poolWebsite;
        this.poolServers = poolServers;
        this.poolPublicKey = poolPublicKey

        this._emitPoolNotification();
    }

    _emitPoolNotification(){

        StatusEvents.emit("miner-pool/newPoolURL", { poolName: this.poolName, poolFee: this.poolFee, poolWebsite: this.poolWebsite, poolServers: this.poolServers });

    }

    async saveMinerPoolPrivateKey(){

        let result = await this._db.save("pool_privateKey", this._minerPoolPrivateKey);

        return result;
    }

    async _getMinerPoolPrivateKey(){

        this._minerPoolPrivateKey = await this._db.get("pool_privateKey", 30*1000, true);

        if (this._minerPoolPrivateKey === null)
            this._minerPoolPrivateKey = ed25519.generatePrivateKey();

        if ( Buffer.isBuffer(this._minerPoolPrivateKey) ) {
            this.minerPoolPublicKey = ed25519.generatePublicKey(this._minerPoolPrivateKey);
        }

        return this._minerPoolPrivateKey;
    }


    async saveMinerPoolDetails(){

        let result = await this._db.save("miner_pool_url", this._poolURL);

        return  result;
    }

    async _getMinerPoolDetails(){

        let poolURL = await this._db.get("miner_pool_url", 30*1000, true);

        this.setPoolURL(poolURL);

    }

    minerPoolDigitalSign(message){

        let signature = ed25519.sign( message, this._minerPoolPrivateKey );
        return signature;

    }

}

export default MinerPoolSettings;