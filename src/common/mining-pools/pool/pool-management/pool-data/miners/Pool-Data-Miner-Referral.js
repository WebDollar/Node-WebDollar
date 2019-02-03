import Serialization from "common/utils/Serialization";
import BufferExtended from "common/utils/BufferExtended";
import consts from "consts/const_global"
import InterfaceBlockchainAddressHelper from "common/blockchain/interface-blockchain/addresses/Interface-Blockchain-Address-Helper";

class PoolDataMinerReferral {

    constructor(poolData, referrals, miner, refereeAddress, refereeMiner){

        this.referrals = referrals;
        this.poolData = poolData;
        this.miner = miner;

        this.refereeAddress = refereeAddress; //the referee
        this.refereeMiner = refereeMiner; //the referee

        if (this.refereeAddress )
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

        if (this.refereeMiner)
            return this.refereeMiner;

        if ( !this.refereeAddress ) return null;

        let refereeMiner = this.poolData.findMiner( this.refereeAddress );
        if (!refereeMiner ) throw {message: "couldn't find refereeAddress", refereeAddress: this.refereeAddress}
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

    toJSON(){

        return {
            total: Math.floor( this._rewardReferralTotal ),
            confirmed: Math.floor( this._rewardReferralConfirmed ),
            sent: Math.floor( this._rewardReferralSent  ),

            address: this.refereeAddress ? InterfaceBlockchainAddressHelper.generateAddressWIF(this.refereeAddress, false, true) : '',
            online: this.refereeMiner ? this.refereeMiner.isOnline : undefined,
        }

    }

}

export default PoolDataMinerReferral;