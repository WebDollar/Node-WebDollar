import Serialization from "common/utils/Serialization";

const BigNumber = require('bignumber.js');
import PoolDataBlockInformationMinerInstance from "./Pool-Data-Block-Information-Miner-Instance"
import BufferExtended from "common/utils/BufferExtended";
import consts from 'consts/const_global';

class PoolDataBlockInformation {

    constructor(poolManagement, index, totalDifficulty){

        this.poolManagement = poolManagement;

        this.index = index;

        if (totalDifficulty === undefined)
            totalDifficulty = new BigNumber(0);

        this.totalDifficulty = totalDifficulty;

        this.blockInformationMinersInstances = [];

    }

    adjustBlockInformationDifficulty(difficulty, hash){

        // target     =     maximum target / difficulty
        // difficulty =     maximum target / target

        if (difficulty === undefined)
            difficulty = consts.BLOCKCHAIN.BLOCKS_MAX_TARGET.dividedToIntegerBy( new BigNumber ( "0x"+ hash.toString("hex") ) );

        this.totalDifficulty  = this.totalDifficulty.plus( difficulty );

    }

    async updateWorkBlockInformationMinerInstance(minerInstance, work){

        let blockInformationMinerInstance = this._addBlockInformationMinerInstance(minerInstance);

        if ( await blockInformationMinerInstance.validateWorkHash( work.hash, work.nonce ) ){

            blockInformationMinerInstance.workHash = work.hash;
            blockInformationMinerInstance.workHashNonce = work.nonce;

            blockInformationMinerInstance.calculateDifficulty();
            blockInformationMinerInstance.adjustDifficulty(blockInformationMinerInstance.workDifficulty);

            return {result: true, potentialReward: blockInformationMinerInstance.potentialReward, confirmedReward: 0 };

        } else {

            //remove blockInformation
            this._deleteBLockInformationMinerInstance(minerInstance);

        }

        return {result: false, potentialReward: 0 };

    }

    getRewardBlockInformationMinerInstance(minerInstance){

        let blockInformationMinerInstance = this._findBlockInformationMinerInstance(minerInstance);

        if (blockInformationMinerInstance === null) throw {message: "blockInformation - miner instance was not found "};

        return blockInformationMinerInstance.reward;

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




    _findBlockInformationMinerInstance(minerInstance){

        for (let i=0; i<this.blockInformationMinersInstances.length; i++)
            if (this.blockInformationMinersInstances[i].minerInstance === minerInstance )
                return this.blockInformationMinersInstances[i];

        return null;
    }

    _addBlockInformationMinerInstance(minerInstance){

        let blockInformationMinerInstance = this._findBlockInformationMinerInstance(minerInstance);

        if (blockInformationMinerInstance === null){

            blockInformationMinerInstance = new PoolDataBlockInformationMinerInstance(this.poolManagement, this, minerInstance);

            this.blockInformationMinersInstances.push(blockInformationMinerInstance);

        }

        return blockInformationMinerInstance;
    }

    _deleteBLockInformationMinerInstance(minerInstance){

        for (let i=this.blockInformationMinersInstances.length-1; i>=0; i--)
            if (this.blockInformationMinersInstances[i].minerInstance === minerInstance ){

                this.totalDifficulty = this.totalDifficulty.minus(this.blockInformationMinersInstances[i].minerTotalDifficulty);
                this.blockInformationMinersInstances.splice(i,1);

                for (let j=0; j<this.blockInformationMinersInstances.length; j++)
                    this.blockInformationMinersInstances.adjustDifficulty(0);

            }
    }

}

export default PoolDataBlockInformation;