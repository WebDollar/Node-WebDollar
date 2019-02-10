import StatusEvents from "common/events/Status-Events";
import Log from 'common/utils/logging/Log';

class MinerPoolReferrals{

    constructor(minerPoolManagement){

        this.minerPoolManagement = minerPoolManagement;

        this.requireReferrals = false;

        this.referralData = {

            referralLinkAddress: undefined,
            referralLinkAddressOnline: undefined,

            referralsTotal: 0,//link to the referral
            referralsConfirmed: 0, // total - no confirmed
            referralsSent: 0,//confirmed but not sent

            referees: [],
        };

    }

    startLoadMinerPoolReferrals(){
        if (this._referralTimeout ) return;
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
        
        await this.requestReferrals();

        this._referralTimeout = setTimeout( this._loadReferrals.bind(this), 60*1000 );
        
    }
    
    async requestReferrals(){

        try {

            let data = await this.minerPoolManagement.minerPoolProtocol.getReferralData();

            if ( !data ) throw {message: "get-referrals didn't work"};

            for (let i=0; i < data.referrals.referees.length; i++)
                data.referrals.referees[i].referralAddress = this.minerPoolManagement.minerPoolMining.minerAddress;

            this.referralData = {

                referralLinkAddress: data.referrals.linkAddress,
                referralLinkAddressOnline: data.referrals.linkAddressOnline,

                referralsTotal: data.referrals.total,//link to the referral
                referralsConfirmed: data.referrals.confirmed, // total - no confirmed
                referralsSent: data.referrals.sent,//confirmed but not sent

                referees: data.referrals.referees,
            };

            StatusEvents.emit("mining-pool/pool-referral-data-changed", { data: this.referralData } );

        } catch (exception){
            //Log.error("Error loading Referrals", Log.LOG_TYPE.POOLS, exception);
        }
        
    }



}

export default MinerPoolReferrals;