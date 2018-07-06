import Serialization from 'common/utils/Serialization';
import consts from 'consts/const_global';
import BufferExtended from "common/utils/BufferExtended";


class PoolDataMinerInstance {

    constructor(miner, publicKey, socket){

        this.miner = miner;
        this.publicKey = publicKey;

        if (publicKey !== undefined)
            this.publicKeyString = publicKey.toString("hex");

        this.hashesPerSecond = 500;
        this.socket = socket;

        this.work = undefined;
        this.dateActivity = new Date().getTime();
        this.lastBlockInformation = undefined;

    }

    destroyPoolDataMinerInstance(){
        this.miner = undefined;
        this.lastBlockInformation = undefined;
        this.work = undefined;
        this.socket = undefined;
    }


    serializeMinerInstance(version){

        let list = [];

        list.push(this.publicKey);
        list.push(Serialization.serializeNumber4Bytes(this.hashesPerSecond) );

        if (version >= 0x03)
            list.push ( Serialization.serializeNumber4Bytes(this.dateActivity / 1000) );

        return Buffer.concat(list);

    }

    deserializeMinerInstance(buffer, offset, version){

        this.publicKey = BufferExtended.substr( buffer, offset, consts.ADDRESSES.PUBLIC_KEY.LENGTH );
        offset += consts.ADDRESSES.PUBLIC_KEY.LENGTH;

        //calculate the publicKeyString
        this.publicKeyString = this.publicKey.toString("hex");

        this.hashesPerSecond = Serialization.deserializeNumber( BufferExtended.substr( buffer, offset, 4 ) );
        offset += 4;

        if (version >= 0x03){
            this.dateActivity = Serialization.deserializeNumber4Bytes( buffer, offset ) * 1000;
            offset += 4;
        }

        return offset;

    }

}

export default PoolDataMinerInstance;