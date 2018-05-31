import InterfaceSatoshminDB from 'common/satoshmindb/Interface-SatoshminDB';
import consts from 'consts/const_global';
import WebDollarCrypto from "../../crypto/WebDollar-Crypto";
import ed25519 from "common/crypto/ed25519";

import Utils from "common/utils/helpers/Utils";

class MinerPoolSettings {

    constructor( databaseName ){

        this._db = new InterfaceSatoshminDB( databaseName ? databaseName : consts.DATABASE_NAMES.POOL_DATABASE );

        this._minerPoolPrivateKey = WebDollarCrypto.getBufferRandomValues(64);
        this._minerPoolPublicKey = undefined;

        this.poolPublicKey = new Buffer(0);

        this._poolURL = undefined;

        this.poolName = "";
        this.poolWebsite = "";
        this.poolDescription = "";
        this.poolServers = [];

    }

    async initializeMinerPoolSettings(){

        await this._getPoolDetails();
        await this._getMinerPoolPrivateKey();
    }


    get poolURL(){

        return this._poolURL;
    }

    setPoolURL(newValue){

        this._poolURL = newValue;

        this.extractPoolURL();

        return this.saveMinerPoolDetails();
    }

    extractPoolURL(){

        this.poolName = "";
        this.poolWebsite = "";
        this.poolDescription = "";
        this.poolServers = [];

        if ( this._poolURL === "" || this._poolURL === undefined ) return;

        let loc = new URL(this._poolURL);

        let search = loc.pathname;

        this.poolName = search.substr(0, search.indexOf( "/" ));
        search = search.substr(search.indexOf( "/" )+1);

        this.poolWebsite = search.substr( 0, search.indexOf( "/" ));
        search = search.substr(search.indexOf( "/" )+1);

        let servers = search.substr( 0, search.indexOf( "/" ));
        this.poolServers = JSON.parse( servers );

    }

    async saveMinerPoolPrivateKey(){

        let result = await this._db.save("pool_privatekey", this._minerPoolPrivateKey);

        return result;
    }

    async _getMinerPoolPrivateKey(){

        this._minerPoolPrivateKey = await this._db.get("pool_privatekey", 30*1000, true);

        if (this._minerPoolPrivateKey === null)
            this._minerPoolPrivateKey = WebDollarCrypto.getBufferRandomValues( 64 );

        if ( Buffer.isBuffer(this._minerPoolPrivateKey) ) {
            this._minerPoolPublicKey = ed25519.generatePublicKey(this._minerPoolPrivateKey);
        }

        return this._minerPoolPrivateKey;
    }


    async saveMinerPoolDetails(){

        let result = await this._db.save("miner_pool_url", this._poolURL);

        return  result;
    }

    async _getPoolDetails(){

        let poolURL = await this._db.get("miner_pool_url", 30*1000, true);

        this.setPoolURL(poolURL);

    }

    minerPoolDigitalSign(message){

        let signature = ed25519.sign( message, this._minerPoolPrivateKey );
        return signature;

    }

}

export default MinerPoolSettings;