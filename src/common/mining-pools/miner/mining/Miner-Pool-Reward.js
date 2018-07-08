import StatusEvents from "common/events/Status-Events";

class MinerPoolReward{

    constructor(minerPoolManagement){

        this.minerPoolManagement = minerPoolManagement;

        this._totalReward = 0;
        this._confirmedReward = 0;

        this._totalReferralReward = 0;
        this._confirmedReferralReward = 0;

    }

    get total(){
        return this._totalReward + this._totalReferralReward;
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


    set totalReferralReward(newValue){

        if (this._totalReferralReward === newValue || typeof newValue !== "number") return;
        this._totalReferralReward = parseInt( newValue );

        StatusEvents.emit("miner-pool/referral-total-reward", { referralTotalReward: this._totalReferralReward });

    }

    set confirmedReferralReward (newValue){

        if (this._confirmedReferralReward === newValue || typeof newValue !== "number") return;
        this._confirmedReferralReward = parseInt( newValue );

        StatusEvents.emit("miner-pool/referral-confirmed-reward", { referralConfirmedReward: this._confirmedReferralReward });

    }


    get totalReferralReward(){
        return this._totalReferralReward;
    }

    get confirmedReferralReward(){
        return this._confirmedReferralReward;
    }


    setReward(data){

        this.confirmedReward = data.confirmed;
        this.totalReward = data.reward;
        this.totalReferralReward = data.refReward;
        this.confirmedReferralReward = data.refConfirmed;

    }

}

export default MinerPoolReward;