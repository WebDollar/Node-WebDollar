import Serialization from 'common/utils/Serialization';
import BufferExtended from 'common/utils/BufferExtended';

class PoolDataMiner{

    constructor(index, address, reward, publicKeys){

        this.index = index;
        this.address = address;
        this.reward =reward;

        if (!Array.isArray(publicKeys))
            publicKeys = [publicKeys];

        this.publicKeys = publicKeys;

    }

    addPublicKey(publicKey){

        if (this.findPublicKey(publicKey) === -1)
            this.publicKeys.push(publicKey);

    }

    findPublicKey(publicKey){

        for (let i=0; i<this.publicKeys.length; i++)
            if (this.publicKeys[i].minerAddress.equals ( publicKey) )
                return true;

        return false
    }

    serializeMiner(){

        let list = [];

        list.push( Serialization.serializeNumber1Byte(BufferExtended.fromBase(this.address).length) );
        list.push( BufferExtended.fromBase(this.address) );

        list.push ( Serialization.serializeNumber8Bytes(this.reward) );

        return Buffer.concat(list);

    }

    deserializeMiner(offset, buffer){

        let len = Serialization.deserializeNumber( BufferExtended.substr( buffer, offset, 1 ) );
        offset += 1;

        this.address = BufferExtended.toBase( BufferExtended.substr(buffer, offset, len) );
        offset += len;

        this.minerReward = Serialization.deserializeNumber8BytesBuffer(buffer, offset);
        offset += 7;

        return offset;

    }

}

export default PoolDataMiner;