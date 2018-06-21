import StatusEvents from "common/events/Status-Events";

class MinerPoolReward{

    constructor(minerPoolManagement){

        this.minerPoolManagement = minerPoolManagement;

        this._totalReward = 0;
        this._confirmedReward = 0;

    }

    set totalReward(newValue){

        if (this._totalReward === newValue || typeof newValue !== "number") return;
        this._totalReward = parseInt( newValue);

        StatusEvents.emit("miner-pool/total-reward", { totalReward: newValue });

    }

    get totalReward(){
        return this._totalReward;
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