import InterfaceSatoshminDB from 'common/satoshmindb/Interface-SatoshminDB';
import consts from 'consts/const_global';
import PoolsUtils from "common/mining-pools/common/Pools-Utils"
import StatusEvents from "common/events/Status-Events";

class PoolSettings {

    constructor(poolManagement, databaseName){

        this.poolManagement = poolManagement;
        this._db = new InterfaceSatoshminDB( databaseName ? databaseName : consts.DATABASE_NAMES.SERVER_POOL_DATABASE );

        this._serverPoolFee = 0;
        this._serverPoolActivated = false;

    }

    async initializeServerPoolSettings(){

        let result;

        try {
            result = await this._getServerPoolDetails();
        } catch (exception){

            console.error("ServerPools returned an error ",exception);
            if (process.env.BROWSER)
                alert("ServerPools returned an error "+ exception.message);

            return false;
        }

        return result;

    }

    async setServerPoolActivated(newValue, skipSaving = false){

        PoolsUtils.validatePoolActiviated(newValue);

        this._serverPoolActivated = newValue;

        if (!skipSaving)
            if (false === await this._db.save("serverPool_activated", this._serverPoolActivated ? "true" : "false")) throw {message: "serverPoolActivated couldn't be saved"};

        StatusEvents.emit("server-pools/settings", { message: "Server Pool Settings were saved", serverPoolActivated: this._serverPoolActivated  });
    }



    get serverPoolActivated(){
        return this._serverPoolActivated;
    }



    get serverPoolFee(){
        return this._serverPoolFee;
    }

    async setServerPoolFee(newValue, skipSaving = false){

        if (this._serverPoolFee === newValue) return;

        PoolsUtils.validatePoolFee(newValue);

        this._serverPoolFee = newValue;

        if (!skipSaving)
            if (false === await this._db.save("serverPool_fee", this._poolFee)) throw {message: "PoolFee couldn't be saved"};

    }

    async _getServerPoolDetails(){

        let serverPoolFee = await this._db.get("serverPool_fee", 30 * 1000, true);

        if (serverPoolFee === null) serverPoolFee = 0;

        serverPoolFee = parseFloat(serverPoolFee);

        let serverPoolActivated = await this._db.get("serverPool_activated", 30*1000, true);
        if (serverPoolActivated === null) serverPoolActivated = false;

        await PoolsUtils.validatePoolActiviated(serverPoolFee);
        await PoolsUtils.validatePoolActiviated(serverPoolActivated);

        await this.setServerPoolFee(serverPoolFee, true);
        await this.setPoolActivated(serverPoolActivated, true);

        return true;
    }

}

export default PoolSettings;