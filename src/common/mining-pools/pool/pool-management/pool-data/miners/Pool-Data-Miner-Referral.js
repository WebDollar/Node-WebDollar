import Serialization from "common/utils/Serialization";
import BufferExtended from "common/utils/BufferExtended";
import consts from "consts/const_global"

class PoolDataMinerReferral {

    constructor(poolData, referrals, miner, refereeAddress, refereeMiner){

        this.referrals = referrals;
        this.poolData = poolData;
        this.miner = miner;

        this.refereeAddress = refereeAddress; //the referee
        this.refereeMiner = refereeMiner; //the referee

        if (this.refereeAddress !== undefined)
            this.findRefereeAddress();

        this._rewardReferralTotal = 0; // total - no confirmed
        this._rewardReferralConfirmed = 0; //confirmed but not sent
        this._rewardReferralSent = 0;

    }

    destroyPoolDataMinerReferral(){
        this.poolData = undefined;
        this.miner = undefined;
        this.refereeMiner = undefined;
    }

    serializeMinerReferral(){

        return Buffer.concat([

            this.refereeAddress,
            Serialization.serializeNumber7Bytes( this.rewardReferralSent ),

        ]);

    }

    deserializeMinerReferral ( buffer, offset ){

        this.refereeAddress = BufferExtended.substr(buffer, offset, consts.ADDRESSES.ADDRESS.LENGTH);
        offset += consts.ADDRESSES.ADDRESS.LENGTH;

        this._rewardReferralTotal = 0;
        this._rewardReferralConfirmed = 0;

        this._rewardReferralSent = Serialization.deserializeNumber7Bytes(buffer, offset);
        offset += 7;

        return offset;
    }


    findRefereeAddress(){

        if (this.refereeMiner !== null && this.refereeMiner !== undefined)
            return this.refereeMiner;

        if (this.refereeAddress === undefined) return null;

        let refereeMiner = this.poolData.findMiner( this.refereeAddress );
        if (refereeMiner === null || refereeMiner === undefined) throw {message: "couldn't find refereeAddress", refereeAddress: this.refereeAddress}
        else this.refereeMiner = refereeMiner;

        return this.refereeMiner;
    }



    set rewardReferralTotal(newValue){

        let prevVal = this._rewardReferralTotal;
        this._rewardReferralTotal = newValue;
        this.referrals.rewardReferralsTotal += newValue - prevVal;

    }

    get rewardReferralTotal(){
        return this._rewardReferralTotal;
    }

    set rewardReferralConfirmed(newValue){

        let prevVal = this._rewardReferralConfirmed;
        this._rewardReferralConfirmed = newValue;
        this.referrals.rewardReferralsConfirmed += newValue - prevVal;

    }

    get rewardReferralConfirmed(){
        return this._rewardReferralConfirmed;
    }

    set rewardReferralSent(newValue){

        let prevVal = this._rewardReferralSent;
        this._rewardReferralSent = Math.max( 0, Math.floor( newValue ));
        this.referrals.rewardReferralsSent += newValue - prevVal;

    }

    get rewardReferralSent(){
        return this._rewardReferralSent;
    }


}

export default PoolDataMinerReferral;