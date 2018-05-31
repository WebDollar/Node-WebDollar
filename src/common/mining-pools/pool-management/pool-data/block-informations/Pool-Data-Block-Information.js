import Serialization from "common/utils/Serialization";

const BigNumber = require('bignumber.js');
import PoolDataBlockInformationMinerInstance from "./Pool-Data-Block-Information-Miner-Instance"
import BufferExtended from "common/utils/BufferExtended";

class PoolDataBlockInformation {

    constructor(poolManagement, index, totalDifficulty){

        this.poolManagement = poolManagement;

        this.index = index;

        if (totalDifficulty === undefined)
            totalDifficulty = new BigNumber(0);

        this.totalDifficulty = totalDifficulty;

        this.blockInformationMinersInstances = [];

    }

    findBlockInformationMinerInstance(minerInstance){

        for (let i=0; i<this.blockInformationMinersInstances.length; i++)
            if (this.blockInformationMinersInstances[i].minerInstance === minerInstance )
                return this.blockInformationMinersInstances[i];

        return null;
    }

    addBlockMinerInstance(minerInstance){

        let blockInformationMinerInstance = this.findBlockInformationMinerInstance(minerInstance);
        if (blockInformationMinerInstance === null){

            blockInformationMinerInstance = new PoolDataBlockInformationMinerInstance(this.poolManagement, this, minerInstance);
            this.blockInformationMinersInstances.push(blockInformationMinerInstance);

        }

        return blockInformationMinerInstance;
    }

    updateWorkBlockInformationMinerInstance(minerInstance, work){

    }

    serializeBlockInformation(){

        let buffers = [];

        buffers.push ( Serialization.serializeNumber4Bytes(this.blockInformationMinersInstances.length));

        for (let i=0; i<this.blockInformationMinersInstances.length; i++)
            buffers.push( this.blockInformationMinersInstances[i].serializeBlockInformationMinerInstance() );

        return Buffer.concat( buffers );
    }


    deserializeBlockInformation(buffer, offset = 0){

        let length = Serialization.deserializeNumber( BufferExtended.substr( buffer, offset, 4 )  );
        offset +=4;

        for (let i=0; i<length; i++){

            let blockInformationMinerInstance = new PoolDataBlockInformationMinerInstance(this.poolManagement, this, undefined);
            offset = blockInformationMinerInstance.deserializeBlockInformationMinerInstance(buffer, offset);

        }

        return offset;

    }

}

export default PoolDataBlockInformation;