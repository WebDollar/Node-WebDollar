import Serialization from 'common/utils/Serialization';
import BufferExtended from 'common/utils/BufferExtended';
import consts from 'consts/const_global'

class PoolDataMiner{

    constructor(index, address, reward, publicKey){

        this.index = index;
        this.address = address;
        this.reward = reward;

        this.publicKeys = [];

        this.addPublicKey(publicKey);

    }

    addPublicKey(publicKey){

        if (!Buffer.isBuffer( publicKey) || publicKey.length !== consts.ADDRESSES.PUBLIC_KEY.LENGTH) throw {message: "public key is invalid"};

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

        list.push(this.address ); //20 bytes

        list.push ( Serialization.serializeNumber2Bytes(this.publicKeys) );
        for (let i=0; i<this.publicKeys.length; i++)
            list.push(this.publicKeys[i]);

        list.push ( Serialization.serializeNumber8Bytes(this.reward) );

        return Buffer.concat(list);

    }

    deserializeMiner( buffer, offset ){

        this.address = BufferExtended.toBase( BufferExtended.substr(buffer, offset, consts.ADDRESSES.ADDRESS.LENGTH ) );
        offset += consts.ADDRESSES.ADDRESS.LENGTH;

        let len = Serialization.deserializeNumber( BufferExtended.substr( buffer, offset, 2 ) );

        for (let i=0; i<len; i++){
            BufferExtended.substr( buffer, offset, consts.ADDRESSES.PUBLIC_KEY.LENGTH );
            offset += consts.ADDRESSES.PUBLIC_KEY.LENGTH
        }

        this.minerReward = Serialization.deserializeNumber8BytesBuffer(buffer, offset);
        offset += 7;

        return offset;

    }

}

export default PoolDataMiner;