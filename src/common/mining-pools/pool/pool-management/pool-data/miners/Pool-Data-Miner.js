import Serialization from 'common/utils/Serialization';
import BufferExtended from 'common/utils/BufferExtended';
import consts from 'consts/const_global';
import PoolDataMinerInstance from "./Pool-Data-Miner-Instance";
import PoolDataMinerReferrals from "./Pool-Data-Miner-Referrals";

class PoolDataMiner{

    constructor(poolData, index, address, publicKey){

        this.poolData = poolData;

        this.index = index;
        this.address = address;

        this.instances = [];

        if (publicKey !== undefined)
            this.addInstance(publicKey);

        this._rewardTotal = 0;            //pending except last
        this._rewardConfirmed = 0;        //rewardConfirmed
        this._rewardConfirmedOther = 0;   //other money confirmed to be sent
        this._rewardSent = 0;             //rewardSent


        this.referrals = new PoolDataMinerReferrals( poolData, this  );

    }

    destroyPoolDataMiner(){

        this.poolData = undefined;

        for (let i=0; i<this.instances.length; i++)
            this.instances[i].destroyPoolDataMinerInstance();

        this.instances = [];
        this.referrals.destroyPoolDataMinerReferrals();
    }

    addInstance(publicKey){

        if (typeof publicKey === "object" && publicKey.hasOwnProperty("publicKey")) publicKey = publicKey.publicKey;

        if (publicKey === undefined) return;

        if (!Buffer.isBuffer(publicKey) || publicKey.length !== consts.ADDRESSES.PUBLIC_KEY.LENGTH)
            throw {message: "public key is invalid"};

        let instance = this.findInstance(publicKey);

        if ( instance === null) {
            instance = new PoolDataMinerInstance(this, publicKey);
            this.instances.push(instance);
        }

        return instance;

    }

    findInstance(publicKey){

        if (typeof publicKey === "object" && publicKey.hasOwnProperty("publicKey")) publicKey = publicKey.publicKey;

        let pos = this._searchInstance(publicKey);

        if (pos !== -1) return this.instances[pos];

        return null;
    }

    _searchInstance(publicKey){

        if (typeof publicKey === "object" && publicKey.hasOwnProperty("publicKey")) publicKey = publicKey.publicKey;

        for (let i = 0; i < this.instances.length; i++)
            if (this.instances[i].publicKey.equals( publicKey) )
                return i;

        return -1;

    }

    removeInstance(publicKey){

        if (typeof publicKey === "object" && publicKey.hasOwnProperty("publicKey")) publicKey = publicKey.publicKey;

        let pos = this._searchInstance(publicKey);
        if (pos !== -1) {
            this.instances.splice( pos ,1);
            return true;
        }

        return false;
    }

    serializeMiner(){

        let list = [];

        let version = 0x03;

        list.push(Serialization.serializeNumber1Byte( version ) );
        list.push(this.address ); //20 bytes

        list.push ( Serialization.serializeNumber7Bytes( Math.max(0, Math.floor( this._rewardConfirmedOther) )) );
        list.push ( Serialization.serializeNumber7Bytes( Math.max(0, Math.floor( this._rewardSent) )) );

        list.push ( Serialization.serializeNumber4Bytes(this.instances.length) );

        for (let i=0; i<this.instances.length; i++)
            list.push( this.instances[i].serializeMinerInstance(version) );

        if (version >= 0x03)
            list.push( this.referrals.serializeReferrals() );

        return Buffer.concat(list);

    }

    deserializeMiner( buffer, offset ){

        let version =  Serialization.deserializeNumber( BufferExtended.substr( buffer, offset, 1 ) );
        offset += 1;

        this.address = BufferExtended.substr( buffer, offset, consts.ADDRESSES.ADDRESS.LENGTH );
        offset += consts.ADDRESSES.ADDRESS.LENGTH;

        if (version === 0x01) {
            this.rewardTotal = 0;
            offset += 7;
        }

        this.rewardConfirmedOther = Serialization.deserializeNumber7Bytes( BufferExtended.substr( buffer, offset, 7 ) );
        offset += 7;

        if (this.rewardConfirmedOther > 100000000) this.rewardConfirmedOther = 0;

        this.rewardSent = Serialization.deserializeNumber7Bytes( BufferExtended.substr( buffer, offset, 7 ) );
        offset += 7;

        let len = Serialization.deserializeNumber( BufferExtended.substr( buffer, offset, 4 ) );
        offset += 4;

        this.instances = [];
        for (let i=0; i<len; i++){

            let instance = new PoolDataMinerInstance(this, undefined);
            offset = instance.deserializeMinerInstance(buffer, offset, version);

            if (instance.publicKey !== undefined)
                this.instances.push(instance);
        }

        if (version >= 0x03)
            offset = this.referrals.deserializeReferrals(buffer, offset);

        return offset;

    }



    get rewardConfirmedTotal(){
        return this._rewardConfirmed + this._rewardConfirmedOther
    }

    set rewardTotal(newValue){
        this._rewardTotal = Math.max( 0 , Math.floor( newValue ));
    }
    set rewardConfirmed(newValue){
        this._rewardConfirmedOther = Math.max( 0 , Math.floor( newValue ));
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


}

export default PoolDataMiner;