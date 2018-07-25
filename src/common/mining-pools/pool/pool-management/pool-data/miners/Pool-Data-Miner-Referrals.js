import Serialization from "common/utils/Serialization";
import PoolDataMinerReferral from "./Pool-Data-Miner-Referral"
import BufferExtended from "common/utils/BufferExtended"
import consts from "consts/const_global"
import InterfaceBlockchainAddressHelper from "common/blockchain/interface-blockchain/addresses/Interface-Blockchain-Address-Helper";

class PoolDataMinerReferrals {

    constructor(poolData, miner) {

        this.poolData = poolData;
        this.miner = miner;

        this.referralLinkAddress = undefined; //link to the referral
        this.referralLinkMiner = undefined; //link to the referral

        this.array = [];


        this._rewardReferralsTotal = 0; // total - no confirmed
        this._rewardReferralsConfirmed = 0; //confirmed but not sent
        this._rewardReferralsSent = 0;

    }

    destroyPoolDataMinerReferrals(){

        this.poolData = undefined;
        this.miner = undefined;
        this.referralLinkMiner = undefined;

        for (let i=0; i<this.array.length; i++)
            this.array[i].destroyPoolDataMinerReferral();

        this.array = [];

    }

    setReferralLink(address){

        if (typeof address === "string")
            address = InterfaceBlockchainAddressHelper.getUnencodedAddressFromWIF( address );

        if ( address === null || address === undefined || !Buffer.isBuffer(address) || address.length !== consts.ADDRESSES.ADDRESS.LENGTH )
            return false;

        //avoid to be the same person
        if (address.equals(this.miner.address))
            return false;

        this.referralLinkAddress = address;
        this.findReferralLinkAddress();

        return true;
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
        if (linkMiner === undefined || linkMiner === null) return;

        let referralLinkMiner = linkMiner.referrals.addReferral(this.miner.address, this.miner);

        if (referralLinkMiner === undefined || referralLinkMiner === null) this.referralLinkMiner = undefined;
        else this.referralLinkMiner = referralLinkMiner;

        return this.referralLinkMiner;

    }

    serializeReferrals(){

        let list = [];

        //referral Link Address
        list.push( Serialization.serializeNumber1Byte( this.referralLinkAddress !== undefined ? 1 : 0 ) );

        if ( this.referralLinkAddress !== undefined )
            list.push ( this.referralLinkAddress );

        list.push( Serialization.serializeNumber1Byte(this.array.length > 0 ? 1 : 0 ) );

        if (this.array.length > 0){

            list.push(Serialization.serializeNumber4Bytes(this.array.length));

            for (let i=0; i < this.array.length; i++ )
                list.push(this.array[i].serializeMinerReferral());

            list.push(Serialization.serializeNumber7Bytes( this.rewardReferralsSent ))

        }

        return Buffer.concat(list);
    }

    deserializeReferrals( buffer, offset ){

        let hasReferralLink = buffer[offset];
        offset +=1;

        if (hasReferralLink === 0x01){
            let address = BufferExtended.substr(buffer, offset, consts.ADDRESSES.ADDRESS.LENGTH);
            offset += consts.ADDRESSES.ADDRESS.LENGTH;

            if (!address.equals(this.miner.address))
                this.referralLinkAddress = address;

        }

        let hasReferrals = buffer[offset];
        offset += 1;

        this._rewardReferralsConfirmed = 0;
        this._rewardReferralsTotal = 0;

        if (hasReferrals === 1){

            let length = Serialization.deserializeNumber4Bytes( buffer, offset );
            offset += 4;

            for (let i=0; i<length; i++){

                let referral = new PoolDataMinerReferral(this.poolData, this, this.miner);
                offset = referral.deserializeMinerReferral(buffer, offset);

                if (!referral.refereeAddress.equals(this.miner.address))
                    this.array.push( referral );
            }



            this._rewardReferralsSent =   Serialization.deserializeNumber7Bytes(buffer, offset);
            offset += 7;

        } else {
            this._rewardReferralsSent = 0;
        }

        return offset;
    }


    addReferral(refereeAddress, refereeMiner){

        let referee = this.findReferral(refereeAddress);
        if (referee === null){
            referee = new PoolDataMinerReferral( this.poolData, this, this.miner, refereeAddress, refereeMiner );
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




    set rewardReferralsTotal(newValue){
        this._rewardReferralsTotal = newValue;
    }

    get rewardReferralsTotal(){
        return this._rewardReferralsTotal;
    }

    set rewardReferralsConfirmed(newValue){
        this._rewardReferralsConfirmed = newValue;
    }

    get rewardReferralsConfirmed(){
        return this._rewardReferralsConfirmed;
    }

    set rewardReferralsSent(newValue){
        this._rewardReferralsSent = Math.max( 0, Math.floor( newValue ));
    }

    get rewardReferralsSent(){
        return this._rewardReferralsSent;
    }

    toJSON(){

        let referees = [];
        for (let i=0; i<this.array.length; i++)
            referees.push( this.array[i].toJSON() )

        return {

            referees: referees,

            linkAddress: InterfaceBlockchainAddressHelper.generateAddressWIF(this.referralLinkAddress, false, true),

            total: this._rewardReferralsTotal,
            confirmed: this._rewardReferralsConfirmed,
            sent: this._rewardReferralsSent,

        }

    }

}

export default PoolDataMinerReferrals