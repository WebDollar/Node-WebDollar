import Serialization from "common/utils/Serialization";
import BufferExtended from "common/utils/BufferExtended";
import consts from "consts/const_global"

class PoolDataMinerReferral{

    constructor(poolData, miner, refereeAddress, refereeMiner){

        this.poolData = poolData;
        this.miner = miner;

        this.refereeAddress = refereeAddress; //the referee
        this.refereeMiner = refereeMiner; //the referee

        this.findRefereeAddress();

        this._rewardReferralTotal = 0; // total - no confirmed
        this._rewardReferralConfirmed = 0; //confirmed but not sent

    }

    destroyPoolDataMinerReferral(){
        this.poolData = undefined;
        this.miner = undefined;
        this.refereeMiner = undefined;
    }

    serializeMinerReferral(){

        return Buffer.concat([

                this.refereeAddress,
                Serialization.serializeNumber7Bytes( this.rewardReferralConfirmed ),

        ]);

    }

    deserializeMinerReferral ( buffer, offset ){

        this.refereeAddress = BufferExtended.substr(buffer, offset, consts.ADDRESSES.ADDRESS.LENGTH);

        this._rewardReferralTotal = 0;

        this._rewardReferralConfirmed = Serialization.deserializeNumber7Bytes(buffer, offset);
        offset += 7;

        return offset;
    }


    findRefereeAddress(){

        if (this.refereeMiner !== null && this.refereeMiner !== undefined)
            return this.refereeMiner;

        if (this.refereeAddress === undefined) return null;

        this.refereeMiner = this.poolData.findMiner( this.refereeAddress );

        return this.refereeMiner;
    }



    set rewardReferralTotal(newValue){
        this._rewardReferralTotal = Math.max( 0, Math.floor( newValue ));
    }

    get rewardReferralTotal(){
        return this._rewardReferralTotal;
    }

    set rewardReferralConfirmed(newValue){

        let prevVal = this._rewardReferralConfirmed;
        this._rewardReferralConfirmed = Math.max( 0, Math.floor( newValue ));
        this.miner.rewardConfirmedOther += newValue - prevVal;

    }

    get rewardReferralConfirmed(){
        return this._rewardReferralConfirmed;
    }



}

export default PoolDataMinerReferral;