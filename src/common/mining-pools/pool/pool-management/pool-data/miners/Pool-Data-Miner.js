import Serialization from 'common/utils/Serialization';
import BufferExtended from 'common/utils/BufferExtended';
import consts from 'consts/const_global';
import PoolDataMinerInstance from "./Pool-Data-Miner-Instance";
import PoolDataMinerReferrals from "./Pool-Data-Miner-Referrals";

class PoolDataMiner{

    constructor(poolData, index, address){

        this.poolData = poolData;

        this.index = index;
        this.address = address;

        this.instances = [];

        this._rewardTotal = 0;            //pending except last
        this._rewardConfirmed = 0;        //rewardConfirmed
        this._rewardConfirmedOther = 0;   //other money confirmed to be sent
        this._rewardSent = 0;             //rewardSent

        this.dateActivity = 0;

        this.referrals = new PoolDataMinerReferrals( poolData, this  );

    }

    destroyPoolDataMiner(){

        this.poolData = undefined;

        for (let i=0; i<this.instances.length; i++)
            this.instances[i].destroyPoolDataMinerInstance();

        this.instances = [];
        this.referrals.destroyPoolDataMinerReferrals();
    }

    addInstance(socket){

        let instance = this.findInstance(socket);

        if ( !instance ) {
            instance = new PoolDataMinerInstance(this, socket);
            this.instances.push(instance);
        }

        return instance;

    }

    findInstance(socket, returnPos = false){

        for (let i = 0; i < this.instances.length; i++)
            if (this.instances[i].socket === socket )
                return returnPos ? i : this.instances[i];

        return returnPos ? -1 : null;
    }

    removeInstance(socket){

        let pos = this.findInstance(socket, true);

        if (pos !== -1)
            this.instances.splice( pos ,1);
            return true;

        return false;
    }

    serializeMiner(){

        let list = [];

        let version = 0x03;

        list.push(Serialization.serializeNumber1Byte( version ) );
        list.push(this.address ); //20 bytes

        list.push ( Serialization.serializeNumber7Bytes( Math.max(0, Math.floor( this._rewardConfirmedOther) )) );
        list.push ( Serialization.serializeNumber7Bytes( Math.max(0, Math.floor( this._rewardSent) )) );

        if (version >= 0x03)
            list.push( this.referrals.serializeReferrals() );

        return Buffer.concat(list);

    }

    deserializeMiner( buffer, offset ){

        let version =  Serialization.deserializeNumber1Bytes( buffer, offset, );
        offset += 1;

        this.address = BufferExtended.substr( buffer, offset, consts.ADDRESSES.ADDRESS.LENGTH );
        offset += consts.ADDRESSES.ADDRESS.LENGTH;

        if (version === 0x01) {
            this.rewardTotal = 0;
            offset += 7;
        }

        this.rewardConfirmedOther = Serialization.deserializeNumber7Bytes( buffer, offset, );
        offset += 7;

        if (this.rewardConfirmedOther > 10000000000) this.rewardConfirmedOther = 0;

        this.rewardSent = Serialization.deserializeNumber7Bytes( buffer, offset, );
        offset += 7;

        this.instances = [];

        //TODO: to be removed
        if (version === 0x02) {

            let len = Serialization.deserializeNumber4Bytes( buffer, offset, );
            offset += 4;

            this.publicKeys = [];
            for (let i = 0; i < len; i++) {

                this.publicKeys.push( BufferExtended.substr( buffer, offset, consts.ADDRESSES.PUBLIC_KEY.LENGTH ) );
                offset += consts.ADDRESSES.PUBLIC_KEY.LENGTH + 4;

            }

        }
        if (version >= 0x03)
            offset = this.referrals.deserializeReferrals(buffer, offset);

        return offset;

    }

    get minerHashesPerSecond(){

        let hashesPerSecond = 0;
        for (let i=0; i<this.instances.length; i++)
            hashesPerSecond += this.instances[i].hashesPerSecond;

        return hashesPerSecond;
    }


    get rewardConfirmedTotal(){
        return this._rewardConfirmed + this._rewardConfirmedOther
    }

    set rewardTotal(newValue){
        this._rewardTotal = Math.max(0, newValue);
    }
    set rewardConfirmed(newValue){
        this._rewardConfirmed = newValue;
    }


    set rewardConfirmedOther(newValue){
        this._rewardConfirmedOther = Math.max( 0 , Math.floor( newValue ));
    }
    set rewardSent(newValue){
        this._rewardSent = Math.max( 0 , Math.floor( newValue ));
    }


    get rewardTotal(){
        return this._rewardTotal;
    }
    get rewardConfirmed(){
        return this._rewardConfirmed;
    }
    get rewardConfirmedOther(){
        return this._rewardConfirmedOther;
    }
    get rewardSent(){
        return this._rewardSent;
    }


    get isOnline(){

        return Math.abs(new Date().getTime()/1000 - this.dateActivity) <= 180;

    }


}

export default PoolDataMiner;