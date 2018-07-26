import StatusEvents from "common/events/Status-Events";
import Log from 'common/utils/logging/Log';

class MinerPoolReferrals{

    constructor(minerPoolManagement){

        this.minerPoolManagement = minerPoolManagement;

        this.requireReferrals = false;

        this.data = {

            referralLinkAddress: undefined,
            rewardReferralsTotal: 0,//link to the referral
            rewardReferralsConfirmed: 0, // total - no confirmed
            rewardReferralsSent: 0,//confirmed but not sent

            referees: [],
        };

    }

    startLoadMinerPoolReferrals(){
        if (this._referralTimeout !== undefined) return;
        this._referralTimeout = setTimeout( this._loadReferrals.bind(this), 60*1000 );
    }

    stopLoadMinerPoolReferrals(){
        clearTimeout(this._referralTimeout);
    }

    async _loadReferrals(){

        if (!this.minerPoolManagement._minerPoolStarted) return;

        if (!this.requireReferrals) {
            this._referralTimeout = setTimeout(this._loadReferrals.bind(this), 10 * 1000);
            return;
        }

        try {

            let data = await this.minerPoolManagement.minerPoolProtocol.getReferralData();

            if (data === undefined || data === null) throw {message: "get-referrals didn't work"};

            StatusEvents.emit("mining-pool/pool-referral-data-changed", { data: this.data } );

        } catch (exception){
            //Log.error("Error loading Referrals", Log.LOG_TYPE.POOLS, exception);
        }

        this._referralTimeout = setTimeout( this._loadReferrals.bind(this), 60*1000 );

    }



}

export default MinerPoolReferrals;