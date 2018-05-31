import Serialization from 'common/utils/Serialization';
import consts from 'consts/const_global';
import BufferExtended from "common/utils/BufferExtended";


class PoolDataMinerInstance {

    constructor(miner, publicKey){

        this.miner = miner;
        this.publicKey = publicKey;
        this.date = new Date().getTime();
        this.hashesPerSecond = 1000;

    }


    serializeMinerInstance(){

        let list = [];

        return Buffer.concat([
            this.publicKey,
            Serialization.serializeNumber7Bytes(this.date),
            Serialization.serializeNumber7Bytes(this.reward),
            Serialization.serializeNumber7Bytes(this.hashesPerSecond),
        ]);

        return Buffer.concat(list);
    }

    deserializeMinerInstance(buffer, offset){

        this.publicKey = BufferExtended.substr( buffer, offset, consts.ADDRESSES.PUBLIC_KEY.LENGTH );
        offset += consts.ADDRESSES.PUBLIC_KEY.LENGTH;

        this.date = Serialization.deserializeNumber7Bytes( BufferExtended.substr( buffer, offset, 7 ) );
        offset += 7;

        this.reward = Serialization.deserializeNumber7Bytes( BufferExtended.substr( buffer, offset, 7 ) );
        offset += 7;

        this.hashesPerSecond = Serialization.deserializeNumber7Bytes( BufferExtended.substr( buffer, offset, 7 ) );
        offset += 7;


        return offset;

    }

}

export default PoolDataMinerInstance;