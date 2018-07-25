import StatusEvents from "common/events/Status-Events";

class MinerPoolReferrals{

    constructor(minerPoolManagement){

        this.minerPoolManagement = minerPoolManagement;

        this.requireReferrals = false;

    }

    startLoadMinerPoolReferrals(){
        this._referralTimeout = setTimeout( this._loadReferrals.bind(this), 60*1000 );
    }

    stopLoadMinerPoolReferrals(){
        clearTimeout(this._referralTimeout);
    }

    async _loadReferrals(poolSocket){

        if (!this.minerPoolManagement._minerPoolStarted) return;

        if (!this.requireReferrals)
            this._referralTimeout = setTimeout( this._loadReferrals.bind(this), 10*1000 );

        try {

            if (data === undefined || data === null) throw {message: "get-referrals didn't work"}



            StatusEvents.emit("mining-pool/")

        } catch (exception){

        }

        this._referralTimeout = setTimeout( this._loadReferrals.bind(this), 60*1000 );

    }



}

export default MinerPoolReferrals;