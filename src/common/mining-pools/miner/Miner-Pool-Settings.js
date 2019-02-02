import InterfaceSatoshminDB from 'common/satoshmindb/Interface-SatoshminDB';
import consts from 'consts/const_global';
import WebDollarCrypto from "common/crypto/WebDollar-Crypto";
import ed25519 from "common/crypto/ed25519";
import StatusEvents from "common/events/Status-Events"

import Utils from "common/utils/helpers/Utils";
import PoolsUtils from "common/mining-pools/common/Pools-Utils"
import Blockchain from "main-blockchain/Blockchain";
import AGENT_STATUS from "../../blockchain/interface-blockchain/agents/Agent-Status";


const sanitizer = require('sanitizer');

class MinerPoolSettings {

    constructor( minerPoolManagement, databaseName ){

        this.minerPoolManagement = minerPoolManagement;

        this._db = new InterfaceSatoshminDB( databaseName ? databaseName : consts.DATABASE_NAMES.MINER_POOL_DATABASE );

        this._poolURL = '';
        this.poolDedicated = false;

        this.poolsList = {};

        this.poolName = "";
        this.poolAddress = "";
        this.poolFee = 0;
        this.poolReferralFee = 0;
        this.poolWebsite = "";
        this.poolDescription = "";
        this.poolServers = [];
        this.poolPublicKey = new Buffer(0);
        this.poolUseSignatures = false;
        this.poolURLReferral = '';

        this._poolMinerAddress = '';

        this._minerPoolActivated = false;

        StatusEvents.on("blockchain/mining/address",async (data)=>{

            if (!this.minerPoolManagement.minerPoolStarted)
                return;

            this.generatePoolURLReferral();

        });

    }



    async initializeMinerPoolSettings(poolURL){

        if (poolURL !== undefined)
            await this.setPoolURL(poolURL);

        await this._getMinerPoolDetails();

        await this._getMinerPoolList();

    }

    generatePoolURLReferral(){

        let url = this._poolURL;
        if (url.indexOf("/r/", url) >= 0)
            url = url.substr(0, url.indexOf("/r/", url));

        this.poolURLReferral =  ( process.env.BROWSER ? window.location.origin : "https://webdollar.ddns.net:9094"  ) + "/pool/"+url +"/r/"+encodeURI(Blockchain.Mining.minerAddress.replace(/#/g, "%23"));

        StatusEvents.emit("miner-pool/referral-url",   { poolURLReferral: this.poolURLReferral });
    }

    get poolURL(){
        return this._poolURL;
    }


    async setPoolURL(newValue, skipSaving = false){

        newValue = await this._replacePoolURL(newValue);

        newValue = sanitizer.sanitize(newValue);

        if (newValue === null || newValue === this._poolURL) return;

        let data = PoolsUtils.extractPoolURL(newValue);
        if (data === null) throw {message: "poolURL is invalid"};

        this.poolName = data.poolName;
        this.poolFee = data.poolFee;
        this.poolWebsite = data.poolWebsite;
        this.poolDescription = data.poolDescription;
        this.poolPublicKey = data.poolPublicKey;
        this.poolReferral = data.poolReferral;

        await this._setPoolServers(data.poolServers);

        this._poolURL = data.poolURL;

        await this.addPoolList(newValue, data);

        if (!skipSaving)
            if (false === await this._db.save("minerPool_poolURL", this._poolURL)) throw {message: "PoolURL couldn't be saved"};

        this.generatePoolURLReferral();

        StatusEvents.emit("miner-pool/newPoolURL", { poolURL: this._poolURL });

        this.notifyNewChanges();

        return true;
    }

    notifyNewChanges(){
        StatusEvents.emit("miner-pool/settings",   { poolURL: this._poolURL, poolName: this.poolName, poolFee: this.poolFee, poolReferralFee: this.poolReferralFee, poolWebsite: this.poolWebsite, poolServers: this.poolServers, minerPoolActivated: this._minerPoolActivated });
    }

    async _setPoolServers(newValue){

        PoolsUtils.validatePoolServers(newValue);

        if ( JSON.stringify(this.poolServers ) === JSON.stringify( newValue ) ) return;

        newValue = PoolsUtils.processServersList( newValue );
        this.poolServers = newValue;

        if (this.minerPoolManagement.minerPoolStarted)
            await this.minerPoolManagement.minerPoolProtocol.insertServersListWaitlist( this.poolServers );

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


    async addPoolList(url, data, save = true){

        if (data === undefined)
            data = PoolsUtils.extractPoolURL(url);

        if (data === null) return;

        let foundPool = this.poolsList[ data.poolPublicKey.toString("hex") ];
        if (foundPool === undefined)
            foundPool = {};

        if (JSON.stringify(this.poolsList[data.poolPublicKey.toString("hex")]) !== JSON.stringify(data)){
            this.poolsList[data.poolPublicKey.toString("hex")] = data;

            if ( save )
                await this._saveMinerPoolList();
        }


    }

    async _saveMinerPoolList(){

        let list = {};
        for (let key in this.poolsList)
            list[key] = this.poolsList[key];

        let result = await this._db.save("minerPool_poolsList", new Buffer( JSON.stringify( list ), "ascii") );
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

        await this._addPoolsList();

        return result;
    }

    async setMinerPoolActivated(newValue, skipSaving = false, useActivation = true){

        if (newValue === this._minerPoolActivated) return ;

        PoolsUtils.validatePoolActivated(newValue);

        this._minerPoolActivated = newValue;

        if (!skipSaving)
            if (false === await this._db.save("minerPool_activated", this._minerPoolActivated ? "true" : "false")) throw {message: "minerPoolActivated couldn't be saved"};

        StatusEvents.emit("miner-pool/settings",   { poolURL: this._poolURL, poolAddress: this.poolAddress, poolName: this.poolName, poolFee: this.poolFee, poolWebsite: this.poolWebsite, poolServers: this.poolServers, minerPoolActivated: this._minerPoolActivated });

        if (useActivation)
            await this.minerPoolManagement.setMinerPoolStarted(newValue, true);

    }

    get minerPoolActivated(){
        return this._minerPoolActivated;
    }

    async _addPoolsList(){

        await this.addPoolList("/pool/1/BACMpool/0.01/21dc1f57cb7338963ea159877b4ade97b71dd11ac17292e3852bdc33a26a17e4/https:$$pool.bacm.ro:443", undefined, true);
        await this.addPoolList("/pool/1/Balanel_si_Miaunel/0.02/cd7217ad76118df5357ae7a094aa48096daae8a67767bd3acbc8638dc68955ac/https:$$webd.pool.coffee:8443", undefined, true);
        await this.addPoolList("/pool/1/WMP/0.02/c01f57930c27e78e434de1243ae02b98e56d6cd3df42d136be1a1c0a0a9a8624/https:$$server.webdollarminingpool.com:443", undefined, true);
        await this.addPoolList("/pool/1/WebDollarPoolWin/0.01/60ba45707efcf2292e1c8d4c6a16b602a58aa8bee04d7d3645198afa4f8435e0/https:$$webdollarpool.win:80", undefined, true);

    }

    async _replacePoolURL(url = ''){

        if (typeof url !== "string") return url;

        if (url.indexOf("WMP/0.02/bdda9527a040d9063e22e1dccc4d860b84227ff73232f5c418054112114a6ea4/https:$$pool.webdollarminingpool.com:443") >= 0)
            url = url.replace( "WMP/0.02/bdda9527a040d9063e22e1dccc4d860b84227ff73232f5c418054112114a6ea4/https:$$pool.webdollarminingpool.com:443", "WMP/0.02/c01f57930c27e78e434de1243ae02b98e56d6cd3df42d136be1a1c0a0a9a8624/https:$$server.webdollarminingpool.com:443", );

        return url;
    }

}

export default MinerPoolSettings;
