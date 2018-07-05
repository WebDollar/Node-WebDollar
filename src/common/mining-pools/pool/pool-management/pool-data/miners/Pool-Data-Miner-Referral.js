import Serialization from "common/utils/Serialization";
import BufferExtended from "common/utils/BufferExtended";
import consts from "consts/const_global"

class PoolDataMinerReferral{

    constructor(address){

        this.address = address;

        this._rewardReferralTotal = 0; // total - no confirmed
        this._rewardReferralConfirmed = 0; //confirmed but not sent
        this._rewardReferralSent = 0; //sent

    }

    serializeMinerReferral(){

        return Buffer.concat([

                this.address,
                Serialization.serializeNumber4Bytes( this.rewardReferralConfirmed ),
                Serialization.serializeNumber4Bytes( this.rewardReferralSent ),

        ]);

    }

    deserializeMinerReferral ( buffer, offset ){

        this.address = BufferExtended.substr(buffer, offset, consts.ADDRESSES.ADDRESS.LENGTH);

        this.rewardReferralTotal = 0;

        this.rewardReferralConfirmed = Serialization.deserializeNumber4Bytes( buffer, offset);
        offset += 4;

        this.rewardReferralSent = Serialization.deserializeNumber4Bytes(buffer, offset);
        offset += 4;

        return offset;
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