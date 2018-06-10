import consts from 'consts/const_global';
import Serialization from "common/utils/Serialization";
import BufferExtended from 'common/utils/BufferExtended';
import InterfaceSatoshminDB from 'common/satoshmindb/Interface-SatoshminDB';

class ServerPoolDataPool{

    constructor(index, poolAddress, poolPublicKey, reward=0){

        this.index = index;
        this.poolAddress = poolAddress;
        this.poolPublicKey = poolPublicKey;

        this.reward = reward;
    }

    serializeServerPoolData(){

        let list = [];

        list.push(this.poolAddress ); //20 bytes
        list.push(this.poolPublicKey ); //20 bytes
        list.push(Serialization.serializeNumber7Bytes(this.reward)); //7 bytes

        return Buffer.concat(list);
    }

    deserializeServerPoolData( buffer, offset ){

        this.address = BufferExtended.toBase( BufferExtended.substr(buffer, offset, consts.ADDRESSES.ADDRESS.LENGTH ) );
        offset += consts.ADDRESSES.ADDRESS.LENGTH;

        this.poolPublicKey = BufferExtended.substr( buffer, offset, consts.ADDRESSES.PUBLIC_KEY.LENGTH );
        offset += consts.ADDRESSES.PUBLIC_KEY.LENGTH;

        this.reward = Serialization.deserializeNumber7Bytes(buffer, offset);
        offset += 7;

        return offset;
    }

}