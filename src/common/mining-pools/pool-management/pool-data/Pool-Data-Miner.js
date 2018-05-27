import Serialization from 'common/utils/Serialization';
import BufferExtended from 'common/utils/BufferExtended';
import consts from 'consts/const_global'

class PoolDataMiner{

    constructor(index, address, reward, publicKey){

        this.index = index;
        this.address = address;

        this.instances = [];

        this.addInstance(publicKey);

    }

    addInstance(publicKey){

        if (!Buffer.isBuffer( publicKey) || publicKey.length !== consts.ADDRESSES.PUBLIC_KEY.LENGTH) throw {message: "public key is invalid"};

        if (this.findInstances(publicKey) === -1)
            this.instances.push(publicKey);

    }

    findInstances(publicKey){

        for (let i=0; i<this.instances.length; i++)
            if (this.instances[i].publicKey.equals ( publicKey) )
                return this.instances[i];

        return null;
    }

    serializeMiner(){

        let list = [];

        list.push(this.address ); //20 bytes

        list.push ( Serialization.serializeNumber2Bytes(this.instances) );
        for (let i=0; i<this.instances.length; i++)
            list.push(this.instances[i].serializeMinerInstance() );

        return Buffer.concat(list);

    }

    deserializeMiner( buffer, offset ){

        this.address = BufferExtended.toBase( BufferExtended.substr(buffer, offset, consts.ADDRESSES.ADDRESS.LENGTH ) );
        offset += consts.ADDRESSES.ADDRESS.LENGTH;

        let len = Serialization.deserializeNumber( BufferExtended.substr( buffer, offset, 2 ) );

        for (let i=0; i<len; i++){
            this.instances[i].deserializeMinerInstance(buffer, offset);
            BufferExtended.substr( buffer, offset, consts.ADDRESSES.PUBLIC_KEY.LENGTH );
            offset += consts.ADDRESSES.PUBLIC_KEY.LENGTH
        }

        this.minerReward = Serialization.deserializeNumber7Bytes(buffer, offset);
        offset += 7;

        return offset;

    }

}

export default PoolDataMiner;