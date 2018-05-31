const BigNumber = require('bignumber.js');
import PoolDataBlockInformationMinerInstance from "./Pool-Data-Block-Information-Miner-Instance"

class PoolDataBlockInformation {

    constructor(index, totalDifficulty){

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

            blockInformationMinerInstance = new PoolDataBlockInformationMinerInstance(minerInstance);
            this.blockInformationMinersInstances.push(blockInformationMinerInstance);

        }

        return blockInformationMinerInstance;
    }

    updateWorkBlockInformationMinerInstance(minerInstance, work){

    }

}

export default PoolDataBlockInformation;