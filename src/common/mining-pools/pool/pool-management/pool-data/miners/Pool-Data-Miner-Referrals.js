import Serialization from "common/utils/Serialization";
import PoolDataMinerReferral from "./Pool-Data-Miner-Referral"
import BufferExtended from "common/utils/BufferExtended"
import consts from "consts/const_global"

class PoolDataMinerReferrals {

    constructor(poolData, miner) {

        this.poolData = poolData;
        this.miner = miner;

        this.referralLinkAddress = undefined; //link to the referral
        this.referralLinkMiner = undefined; //link to the referral

        this.array = [];
    }

    destroyPoolDataMinerReferrals(){

        this.poolData = undefined;
        this.miner = undefined;
        this.referralLinkMiner = undefined;

        for (let i=0; i<this.array.length; i++)
            this.array[i].destroyPoolDataMinerReferral();

        this.array = [];

    }

    refreshRefereeAddresses() {

        for (let i = 0; i < this.array.length; i++)
            this.array[i].findRefereeAddress();

        this.findReferralLinkAddress();

    }

    findReferralLinkAddress(){

        if (this.referralLinkMiner !== null && this.referralLinkMiner !== undefined)
            return this.referralLinkMiner;

        if (this.referralLinkAddress === undefined) return null;

        let linkMiner = this.poolData.findMiner( this.referralLinkAddress );
        this.referralLinkMiner = linkMiner.referrals.addReferral(this.miner.address);

        return this.referralLinkMiner;

    }

    serializeReferrals(){

        let list = [];

        //referral Link Address
        list.push( Serialization.serializeNumber1Byte( this.referralLinkAddress !== undefined ? 1 : 0 ) );

        if ( this.referralLinkAddress !== undefined ){
            list.push ( this.referralLinkAddress );
        }


        list.push( Serialization.serializeNumber1Byte(this.array.length > 0 ? 1 : 0 ) );

        if (this.array.length > 0){

            list.push(Serialization.serializeNumber4Bytes(this.array.length));

            for (let i=0; i < this.array.length; i++ )
                list.push(this.array[i].serializeMinerReferral());

        }

        return Buffer.concat(list);
    }

    deserializeReferrals( buffer, offset ){

        let hasReferralLink = buffer[offset];
        offset +=1;

        if (hasReferralLink === 1){
            this.referralLinkAddress = BufferExtended.substr(buffer, offset, consts.ADDRESSES.ADDRESS.LENGTH);
            this.findReferralLinkAddress();
        }

        let hasReferrals = buffer[offset];
        offset += 1;

        if (hasReferrals === 1){

            let length = Serialization.deserializeNumber4Bytes( buffer, offset );
            offset += 4;

            for (let i=0; i<length; i++){

                let referral = new PoolDataMinerReferral(this.poolData, this);
                offset = referral.deserializeMinerReferral(buffer, offset);

                this.array.push( referral );
            }

        }
        offset +=1;

        return offset;
    }


    addReferral(refereeAddress){

        let referee = this.findReferral(refereeAddress);
        if (referee === null){
            let referee = new PoolDataMinerReferral(this.poolData, this.miner, refereeAddress );
            this.array.push(referee);
        }

        return referee;
    }

    findReferral(refereeAddress, returnPos = false ){

        for (let i=0; i<this.array.length; i++)
            if (this.array[i].refereeAddress.equals(refereeAddress))
                return returnPos ? i : this.array[i];

        return returnPos ? -1 : null;

    }

    deleteReferral(refereeAddress){

        let pos = this.findReferral(refereeAddress, true);
        if (pos === -1) return false;

        this.array[pos].destroyPoolDataMinerReferral();
        this.array.splice(pos, 1);

        return true;
    }

}

export default PoolDataMinerReferrals