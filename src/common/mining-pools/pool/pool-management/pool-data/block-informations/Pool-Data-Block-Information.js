import Serialization from "common/utils/Serialization";

const BigNumber = require('bignumber.js');
import PoolDataBlockInformationMinerInstance from "./Pool-Data-Block-Information-Miner-Instance"
import BufferExtended from "common/utils/BufferExtended";
import consts from 'consts/const_global';

class PoolDataBlockInformation {

    constructor(poolManagement, index, totalDifficulty, block){

        this.poolManagement = poolManagement;

        this.index = index;

        if (totalDifficulty === undefined)
            totalDifficulty = new BigNumber(0);

        this.totalDifficulty = totalDifficulty;

        this.blockInformationMinersInstances = [];

        this.confirmations = 0;
        this.confirmationsFailsTrials = 0;

        this.block = block;

    }

    destroyPoolDataBlockInformation(){

        this.poolManagement = undefined;
        for (let i=0; i<this.blockInformationMinersInstances.length; i++)
            this.blockInformationMinersInstances[i].destroyBlockInformationMinerInstance();

        this.blockInformationMinersInstances = [];

    }

    adjustBlockInformationDifficulty(difficulty, hash){

        // target     =     maximum target / difficulty
        // difficulty =     maximum target / target

        if (difficulty === undefined)
            difficulty = consts.BLOCKCHAIN.BLOCKS_MAX_TARGET.dividedToIntegerBy( new BigNumber ( "0x"+ hash.toString("hex") ) );

        this.totalDifficulty  = this.totalDifficulty.plus( difficulty );

    }


    getRewardBlockInformationMinerInstance(minerInstance){

        let blockInformationMinerInstance = this._findBlockInformationMinerInstance(minerInstance);

        if (blockInformationMinerInstance === null) throw {message: "blockInformation - miner instance was not found "};

        return blockInformationMinerInstance.reward;

    }

    serializeBlockInformation(){

        let buffers = [];

        buffers.push ( Serialization.serializeNumber1Byte( 0x00 ));
        buffers.push ( Serialization.serializeNumber4Bytes(this.blockInformationMinersInstances.length));

        for (let i=0; i<this.blockInformationMinersInstances.length; i++)
            buffers.push( this.blockInformationMinersInstances[i].serializeBlockInformationMinerInstance() );

        let hasBlock = (this.block !== undefined ? 1 : 0);
        buffers.push(Serialization.serializeNumber1Byte(hasBlock));

        //serialize block
        if (this.block !== undefined) {
            buffers.push ( Serialization.serializeNumber4Bytes(this.block.height));
            buffers.push ( this.block.difficultyTarget);
            buffers.push( this.block.serializeBlock() );
        }

        return Buffer.concat( buffers );
    }


    deserializeBlockInformation(buffer, offset = 0){

        let version = Serialization.deserializeNumber( BufferExtended.substr( buffer, offset, 1 )  );
        offset += 1;

        let length = Serialization.deserializeNumber( BufferExtended.substr( buffer, offset, 4 )  );
        offset +=4;

        for (let i=0; i<length; i++){

            let blockInformationMinerInstance = new PoolDataBlockInformationMinerInstance(this.poolManagement, this, undefined);
            offset = blockInformationMinerInstance.deserializeBlockInformationMinerInstance(buffer, offset);

        }

        let hasBlock = Serialization.deserializeNumber( BufferExtended.substr( buffer, offset, 1 )  );
        offset += 1;

        if (hasBlock){
            this.block = this.poolManagement.blockchain.blockCreator.createEmptyBlock(0, undefined);

            let height = Serialization.deserializeNumber( BufferExtended.substr( buffer, offset, 1 )  );
            offset += 4;

            let difficultyTarget = BufferExtended.substr( buffer, offset, 32 ) ;
            offset += 32;

            offset = this.block.deserializeBlock(buffer, height, undefined, difficultyTarget, offset );
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
        if (blockInformationMinerInstance !== null) return blockInformationMinerInstance;


        blockInformationMinerInstance = new PoolDataBlockInformationMinerInstance(this.poolManagement, this, minerInstance);

        if (blockInformationMinerInstance !== undefined)
            this.blockInformationMinersInstances.push(blockInformationMinerInstance);

        return blockInformationMinerInstance;

    }

    _deleteBlockInformationMinerInstance(minerInstance){

        for (let i=this.blockInformationMinersInstances.length-1; i>=0; i--)
            if (this.blockInformationMinersInstances[i].minerInstance === minerInstance ){

                this.blockInformationMinersInstances[i].cancelReward();

                this.totalDifficulty = this.totalDifficulty.minus(this.blockInformationMinersInstances[i].minerInstanceTotalDifficulty);
                this.blockInformationMinersInstances.splice(i,1);

                for (let j=0; j<this.blockInformationMinersInstances.length; j++)
                    this.blockInformationMinersInstances.adjustDifficulty(0);

            }
    }

}

export default PoolDataBlockInformation;