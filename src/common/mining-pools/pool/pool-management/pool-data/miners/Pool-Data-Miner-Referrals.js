import Serialization from "common/utils/Serialization";
import PoolDataMinerReferral from "./Pool-Data-Miner-Referral"
import BufferExtended from "common/utils/BufferExtended"

class PoolDataMinerReferrals {

    constructor(poolData, miner){

        this.poolData = poolData;
        this.miner = miner;

        this.array = [];
    }

    serializeReferrals(){

        let list = [];

        list.push(Serialization.serializeNumber1Byte(this.array.length > 0 ? 1 : 0));

        if (this.array.length){

            list.push(Serialization.serializeNumber4Bytes(this.array.length));

            for (let i=0; i < this.array.length; i++ )
                list.push(this.array[i].serializeMinerReferral());

        }

        return Buffer.concat(list);
    }

    deserializeReferrals( buffer, offset ){

        let hasReferrals = buffer[offset];
        offset += 1;
        if (hasReferrals === 1){

            let length = Serialization.deserializeNumber4Bytes( buffer, offset );
            offset += 4;

            for (let i=0; i<length; i++){

                let referral = new PoolDataMinerReferral();
                offset = referral.deserializeMinerReferral(buffer, offset);

                this.array.push( referral );
            }

        }
        offset +=1;

        return offset;
    }

}

export default PoolDataMinerReferrals