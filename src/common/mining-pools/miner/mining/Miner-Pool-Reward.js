import StatusEvents from "common/events/Status-Events";

class MinerPoolReward{

    constructor(minerPoolManagement){

        this.minerPoolManagement = minerPoolManagement;

        this._potentialReward = 0;
        this._confirmedReward = 0;

    }

    set potentialReward(newValue){

        if (this._potentialReward === newValue || typeof newValue !== "number") return;
        this._potentialReward = parseInt( newValue);

        StatusEvents.emit("miner-pool/potential-reward", { potentialReward: newValue });

    }

    get potentialReward(){
        return this._potentialReward;
    }

    set confirmedReward(newValue){

        if (this._confirmedReward === newValue || typeof newValue !== "number") return;
        this._confirmedReward = parseInt( newValue );

        StatusEvents.emit("miner-pool/confirmed-reward", { confirmedReward: this._confirmedReward });

    }

    get confirmedReward(){

        return this._confirmedReward;

    }

}

export default MinerPoolReward;