import Serialization from "common/utils/Serialization";

import BlockchainMiningReward from 'common/blockchain/global/Blockchain-Mining-Reward';
const BigNumber = require('bignumber.js');
import PoolDataBlockInformationMinerInstance from "./Pool-Data-Block-Information-Miner-Instance"
import BufferExtended from "common/utils/BufferExtended";
import consts from 'consts/const_global';
import Blockchain from "main-blockchain/Blockchain"

class PoolDataBlockInformation {

    constructor(poolManagement, index, totalDifficulty, block, height){

        this.poolManagement = poolManagement;

        this.index = index;

        if (totalDifficulty === undefined)
            totalDifficulty = new BigNumber(0);

        this.totalDifficulty = totalDifficulty;

        this.blockInformationMinersInstances = [];

        this.confirmations = 0;
        this.confirmationsFailsTrials = 0;
        this.confirmed = false;

        this.payout = false;

        if (height < 40) height = 1000;
        this.height = height;

        this.block = block;
        this.date = new Date().getTime();

        this.bestHash = undefined;
        this.timeRemaining = -1;

        this.calculateTargetDifficulty();
    }

    destroyPoolDataBlockInformation(){

        this.poolManagement = undefined;

        for (let i=0; i<this.blockInformationMinersInstances.length; i++)
            this.blockInformationMinersInstances[i].destroyBlockInformationMinerInstance();

        this.blockInformationMinersInstances = [];

        this.block.destroyBlock();
        this.block = undefined;

    }

    adjustBlockInformationDifficulty(difficulty, hash){

        // target     =     maximum target / difficulty
        // difficulty =     maximum target / target

        if (difficulty === undefined)
            difficulty = consts.BLOCKCHAIN.BLOCKS_MAX_TARGET.dividedToIntegerBy( new BigNumber ( "0x"+ hash.toString("hex") ) );

        this.totalDifficultyPlus( difficulty );

    }


    getRewardBlockInformationMinerInstance(minerInstance){

        let blockInformationMinerInstance = this._findBlockInformationMinerInstance(minerInstance);

        if (blockInformationMinerInstance === null) throw {message: "blockInformation - miner instance was not found "};

        return blockInformationMinerInstance.reward;

    }

    serializeBlockInformation(){

        let buffers = [];

        buffers.push ( Serialization.serializeNumber1Byte( 0x01 ));

        buffers.push ( Serialization.serializeNumber4Bytes( this.height || 500 ));

        let length = 0;
        for (let i=0; i<this.blockInformationMinersInstances.length; i++)
            if (this.blockInformationMinersInstances[i].minerInstance !== undefined && this.blockInformationMinersInstances[i].minerInstance !== null && this.blockInformationMinersInstances[i].minerInstance.publicKey !== undefined && this.blockInformationMinersInstances[i].reward > 0)
                length ++;

        buffers.push ( Serialization.serializeNumber4Bytes(length));

        for (let i=0; i<this.blockInformationMinersInstances.length; i++)
            if (this.blockInformationMinersInstances[i].minerInstance !== undefined && this.blockInformationMinersInstances[i].minerInstance !== null && this.blockInformationMinersInstances[i].minerInstance.publicKey !== undefined && this.blockInformationMinersInstances[i].reward > 0)
                buffers.push( this.blockInformationMinersInstances[i].serializeBlockInformationMinerInstance() );

        buffers.push( Serialization.serializeNumber1Byte(this.payout ? 1 : 0) );

        buffers.push( Serialization.serializeNumber1Byte((this.block !== undefined ? 1 : 0)) );

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

        if (version === 1){

            let height = Serialization.deserializeNumber( BufferExtended.substr( buffer, offset, 4 )  );
            offset +=4;

            this.height = height;
        }

        let length = Serialization.deserializeNumber( BufferExtended.substr( buffer, offset, 4 )  );
        offset +=4;

        this.blockInformationMinersInstances = [];

        this.totalDifficulty = new BigNumber(0);

        for (let i=0; i<length; i++){

            let blockInformationMinerInstance = new PoolDataBlockInformationMinerInstance(this.poolManagement, this, undefined);
            offset = blockInformationMinerInstance.deserializeBlockInformationMinerInstance(buffer, offset);

            if (blockInformationMinerInstance.minerInstance === undefined || blockInformationMinerInstance.minerInstance === null) continue;

            this.totalDifficulty = this.totalDifficulty.plus( blockInformationMinerInstance.minerInstanceTotalDifficulty );

            this.blockInformationMinersInstances.push(blockInformationMinerInstance);

        }
        this._calculateTimeRemaining();

        let payout = Serialization.deserializeNumber( BufferExtended.substr( buffer, offset, 1 )  );
        offset += 1;

        this.payout = payout === 1;

        let hasBlock = Serialization.deserializeNumber( BufferExtended.substr( buffer, offset, 1 )  );
        offset += 1;

        if (hasBlock === 1){
            this.block = this.poolManagement.blockchain.blockCreator.createEmptyBlock(0, undefined);

            let height = Serialization.deserializeNumber( BufferExtended.substr( buffer, offset, 4 )  );
            offset += 4;

            let difficultyTarget = BufferExtended.substr( buffer, offset, 32 ) ;
            offset += 32;

            offset = this.block.deserializeBlock(buffer, height, undefined, difficultyTarget,  offset );
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


        blockInformationMinerInstance = new PoolDataBlockInformationMinerInstance(this.poolManagement, this, minerInstance, undefined, );
        this.blockInformationMinersInstances.push(blockInformationMinerInstance);

        return blockInformationMinerInstance;

    }

    _deleteBlockInformationMinerInstance(minerInstance){

        for (let i=this.blockInformationMinersInstances.length-1; i>=0; i--)
            if (this.blockInformationMinersInstances[i].minerInstance === minerInstance ){

                this.blockInformationMinersInstances[i].cancelReward();

                this.totalDifficultyMinus(this.blockInformationMinersInstances[i].minerInstanceTotalDifficulty);
                this.blockInformationMinersInstances.splice(i,1);

                for (let j=0; j<this.blockInformationMinersInstances.length; j++)
                    this.blockInformationMinersInstances.adjustDifficulty(0);

            }
    }


    calculateTargetDifficulty(){

        this.targetDifficulty = consts.BLOCKCHAIN.BLOCKS_MAX_TARGET.dividedBy( new BigNumber ( "0x"+ this.poolManagement.blockchain.getDifficultyTarget().toString("hex") ) );

    }

    _calculateTimeRemaining(){

        // my_difficulty ... x sec
        // target_difficulty ... y sec
        //
        // y = x * target_difficulty / ( sum(  difficulties ) / n);

        let dTime = (new Date().getTime() - this.date)/1000;
        //formula no 1

        // if (this.poolManagement.poolData.blocksInfo.length !== 0 && this.poolManagement.poolData.lastBlockInformation !== this) return;
        //
        // if (this.bestHash === undefined) return 40;
        //

        // this.timeRemaining =  Math.max(0, Math.floor( new BigNumber ( "0x"+ this.bestHash.toString("hex")) .dividedBy( new BigNumber ( "0x"+ this.poolManagement.blockchain.getDifficultyTarget().toString("hex") )) .multipliedBy( dTime ).toNumber() - dTime));

        //formula no 2

        if (this.poolManagement.poolStatistics.poolHashes <= 0) return 40;
        if (Blockchain.blockchain.blocks.networkHashRate <= 0) return 40;

        this.timeRemaining = Math.max(0, Math.floor(  new BigNumber (  Math.floor( Blockchain.blockchain.blocks.networkHashRate)  ).dividedBy( this.poolManagement.poolStatistics.poolHashes ).multipliedBy( consts.BLOCKCHAIN.DIFFICULTY.TIME_PER_BLOCK ).toNumber()  ) )

    }

    totalDifficultyPlus(value){
        this.totalDifficulty = this.totalDifficulty.plus(value);
        this._calculateTimeRemaining();
    }

    totalDifficultyMinus(value){
        this.totalDifficulty = this.totalDifficulty.minus(value);
        this._calculateTimeRemaining();
    }

    set timeRemaining(newValue){

        this._timeRemaining = newValue;

        if (this.poolManagement.poolData.blocksInfo.length === 0 || this.poolManagement.poolData.lastBlockInformation === this)
            this.poolManagement.poolStatistics.poolTimeRemaining = newValue;

    }

}

export default PoolDataBlockInformation;