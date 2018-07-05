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
        this._rewardReferralSent = 0; //sent

    }

    serializeMinerReferral(){

        return Buffer.concat([

                this.refereeAddress,
                Serialization.serializeNumber4Bytes( this.rewardReferralConfirmed ),
                Serialization.serializeNumber4Bytes( this.rewardReferralSent ),

        ]);

    }

    deserializeMinerReferral ( buffer, offset ){

        this.refereeAddress = BufferExtended.substr(buffer, offset, consts.ADDRESSES.ADDRESS.LENGTH);

        this.rewardReferralTotal = 0;

        this.rewardReferralConfirmed = Serialization.deserializeNumber4Bytes( buffer, offset);
        offset += 4;

        this.rewardReferralSent = Serialization.deserializeNumber4Bytes(buffer, offset);
        offset += 4;

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
        this._rewardReferralConfirmed = Math.max( 0, Math.floor( newValue ));
    }

    get rewardReferralConfirmed(){
        return this._rewardReferralConfirmed;
    }

    set rewardReferralSent(newValue){
        this._rewardReferralSent = Math.max( 0, Math.floor( newValue ));
    }

    get rewardReferralSent(){
        return this._rewardReferralSent;
    }



}

export default PoolDataMinerReferral;