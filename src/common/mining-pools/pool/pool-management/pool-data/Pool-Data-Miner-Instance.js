import Serialization from 'common/utils/Serialization';
import consts from 'consts/const_global';
import BufferExtended from "common/utils/BufferExtended";


class PoolDataMinerInstance {

    constructor(miner, publicKey){

        this.miner = miner;
        this.publicKey = publicKey;

        if (publicKey !== undefined)
            this.publicKeyString = publicKey.toString("hex");

        this.hashesPerSecond = 500;

    }


    serializeMinerInstance(){

        let list = [];

        return Buffer.concat([
            this.publicKey,
            Serialization.serializeNumber4Bytes(this.hashesPerSecond),
        ]);

        return Buffer.concat(list);
    }

    deserializeMinerInstance(buffer, offset){

        this.publicKey = BufferExtended.substr( buffer, offset, consts.ADDRESSES.PUBLIC_KEY.LENGTH );
        offset += consts.ADDRESSES.PUBLIC_KEY.LENGTH;

        this.publicKeyString = this.publicKey.toString("hex");

        this.hashesPerSecond = Serialization.deserializeNumber( BufferExtended.substr( buffer, offset, 4 ) );
        offset += 4;

        return offset;

    }

}

export default PoolDataMinerInstance;