import Serialization from 'common/utils/Serialization';
import BufferExtended from 'common/utils/BufferExtended';
import consts from 'consts/const_global';
import PoolDataMinerInstance from "./Pool-Data-Miner-Instance";

class PoolDataMiner{

    constructor(poolData, index, address, publicKey){

        this.poolData = poolData;

        this.index = index;
        this.address = address;

        this.instances = [];

        if (publicKey !== undefined)
            this.addInstance(publicKey);

        this.rewardTotal = 0;            //pending except last
        this.rewardConfirmed = 0;        //rewardConfirmed
        this.rewardConfirmedOther = 0;   //other money confirmed to be sent
        this.rewardSent = 0;             //rewardSent

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

        list.push(Serialization.serializeNumber1Byte(0x02) );
        list.push(this.address ); //20 bytes

        list.push ( Serialization.serializeNumber7Bytes( Math.max(0, Math.floor( this.rewardConfirmedOther) )));
        list.push ( Serialization.serializeNumber7Bytes( Math.max(0, Math.floor( this.rewardSent) )));

        list.push ( Serialization.serializeNumber4Bytes(this.instances.length) );

        for (let i=0; i<this.instances.length; i++)
            list.push(this.instances[i].serializeMinerInstance() );

        return Buffer.concat(list);

    }

    deserializeMiner( buffer, offset ){

        let version =  Serialization.deserializeNumber( BufferExtended.substr( buffer, offset, 1 ) );
        offset += 1;

        this.address = BufferExtended.substr(buffer, offset, consts.ADDRESSES.ADDRESS.LENGTH );
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
            offset = instance.deserializeMinerInstance(buffer, offset);

            if (instance.publicKey !== undefined)
                this.instances.push(instance);
        }

        return offset;

    }


    get rewardConfirmedTotal(){
        return this.rewardConfirmed + this.rewardConfirmedOther
    }

}

export default PoolDataMiner;