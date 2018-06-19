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

        this.addInstance(publicKey);

        this.confirmedReward = 0;

    }

    addInstance(publicKey){

        if (publicKey === undefined) return;

        if (!Buffer.isBuffer(publicKey) || publicKey.length !== consts.ADDRESSES.PUBLIC_KEY.LENGTH) 
            throw {message: "public key is invalid"};

        let instance = this.findInstance(publicKey);
        if ( instance === null) {
            let instance = new PoolDataMinerInstance(this, publicKey);
            this.instances.push(instance);
        }

        return instance;

    }

    findInstance(publicKey){

        for (let i = 0; i < this.instances.length; i++)
            if (this.instances[i].publicKey.equals( publicKey) )
                return this.instances[i];

        return null;
    }

    serializeMiner(){

        let list = [];

        list.push(this.address ); //20 bytes

        list.push ( Serialization.serializeNumber4Bytes(this.instances) );

        for (let i=0; i<this.instances.length; i++)
            list.push(this.instances[i].serializeMinerInstance() );

        return Buffer.concat(list);

    }

    deserializeMiner( buffer, offset ){

        this.address = BufferExtended.toBase( BufferExtended.substr(buffer, offset, consts.ADDRESSES.ADDRESS.LENGTH ) );
        offset += consts.ADDRESSES.ADDRESS.LENGTH;

        let len = Serialization.deserializeNumber( BufferExtended.substr( buffer, offset, 4 ) );
        offset += 4;

        this.instances = [];
        for (let i=0; i<len; i++){
            let instance = new PoolDataMinerInstance(this, undefined);
            offset = instance.deserializeMinerInstance(buffer, offset);

            this.instances.push(instance);
        }

        return offset;

    }


    calculateConfirmedReward(){

        let reward = 0;

        for (let i=0; i<this.instances.length; i++)
            for (let j = 0; j < this.poolData.blocksInfo.length - 2; j++)
                for (let q = 0; q<this.poolData.blocksInfo[j].blockInformationMinersInstances.length; q++)
                    if (this.poolData.blocksInfo[j].blockInformationMinersInstances[q].minerInstance === this.instances[i]){

                        reward += this.poolData.blocksInfo[j].blockInformationMinersInstances[q].reward;

                    }

        return reward;

    }

}

export default PoolDataMiner;