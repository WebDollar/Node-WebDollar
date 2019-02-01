import Serialization from "common/utils/Serialization";

import BlockchainMiningReward from 'common/blockchain/global/Blockchain-Mining-Reward';
const BigNumber = require('bignumber.js');
import PoolDataBlockInformationMinerInstance from "./Pool-Data-Block-Information-Miner-Instance"
import BufferExtended from "common/utils/BufferExtended";
import consts from 'consts/const_global';
import Blockchain from "main-blockchain/Blockchain"
import Log from 'common/utils/logging/Log';
import BlockchainGenesis from 'common/blockchain/global/Blockchain-Genesis'

class PoolDataBlockInformation {

    constructor(poolManagement, index, totalDifficultyPOW =  new BigNumber(0), totalDifficultyPOS =  new BigNumber(0), block, height){

        this.poolManagement = poolManagement;

        this.index = index;

        this.totalDifficultyPOW = totalDifficultyPOW;
        this.totalDifficultyPOS = totalDifficultyPOS;

        this.miningHeights = {
            length: 0,
            blocksPow: 0,
            blocksPos: 0,
        };

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

        if (this.block !== undefined)
            this.block.destroyBlock();

        this.block = undefined;

    }

    adjustBlockInformationDifficultyBestTarget (difficulty, prevDifficulty, height, add ){

        if (typeof height === "string") height = Number.parseInt(height);

        let pos = BlockchainGenesis.isPoSActivated(height);

        let difference = difficulty.minus(prevDifficulty);

        if (!pos) this.totalDifficultyPOW = this.totalDifficultyPOW.plus(difference);
        else if (pos) this.totalDifficultyPOS = this.totalDifficultyPOS.plus(difference);

        this._calculateTimeRemaining();

        let miningHeightDifficulty = this.miningHeights[height] || BigNumber(0);

        if (add && miningHeightDifficulty.plus(difference).isGreaterThan(0 ) ){

            if (!this.miningHeights[height]) { //didn't exist
                this.miningHeights.length++;
                if (pos && !consts.MINING_POOL.SKIP_POS_REWARDS) this.miningHeights.blocksPos++;
                else if ( !pos && !consts.MINING_POOL.SKIP_POW_REWARDS) this.miningHeights.blocksPow++;
            }

            this.miningHeights[height] = miningHeightDifficulty.plus(difference);

        }

        if (!add && miningHeightDifficulty.plus(difference).isLessThanOrEqualTo(0)  && this.miningHeights[height] ){

            this.miningHeights[height] = miningHeightDifficulty.plus( difference );

            if (this.miningHeights[height].isEqualTo(0)){

                delete this.miningHeights[height];
                this.miningHeights.length--;

                if (pos && !consts.MINING_POOL.SKIP_POS_REWARDS) this.miningHeights.blocksPos--;
                else if (!pos && !consts.MINING_POOL.SKIP_POW_REWARDS) this.miningHeights.blocksPow--;

            }


        }

    }

    // adjustBlockInformationDifficulty (difficulty, hash){
    //
    //     // target     =     maximum target / difficulty
    //     // difficulty =     maximum target / target
    //
    //     if (difficulty === undefined)
    //         difficulty = consts.BLOCKCHAIN.BLOCKS_MAX_TARGET.dividedToIntegerBy(new BigNumber("0x" + hash.toString("hex")));
    //
    //     this._totalDifficultyPlus( difficulty );
    //
    // }


    getRewardBlockInformationMinerInstance(minerInstance){

        let blockInformationMinerInstance = this._findBlockInformationMinerInstance(minerInstance);

        if (blockInformationMinerInstance === null) throw {message: "blockInformation - miner instance was not found "};

        return blockInformationMinerInstance.reward;

    }

    serializeBlockInformation(){

        let buffers = [];

        buffers.push ( Serialization.serializeNumber1Byte( 0x03 ));

        buffers.push ( Serialization.serializeNumber4Bytes( this.height || 500 ));

        let minerInstances = [];

        if (this.blockInformationMinersInstances && Array.isArray(this.blockInformationMinersInstances) )
            for (let i=0; i<this.blockInformationMinersInstances.length; i++)
                if (this.blockInformationMinersInstances[i].minerInstance && this.blockInformationMinersInstances[i].reward > 0 )
                    minerInstances.push( this.blockInformationMinersInstances[i].serializeBlockInformationMinerInstance() );


        buffers.push ( Serialization.serializeNumber4Bytes(minerInstances.length) );

        buffers = buffers.concat( minerInstances );

        buffers.push( Serialization.serializeNumber1Byte( this.payout ? 1 : 0 ) );

        let array=[];
        //serialize block
        if (this.block && this.block.blockchain ) {

            try {

                array.push(Serialization.serializeNumber4Bytes( this.block.height ));
                array.push( this.block.difficultyTargetPrev );

                array.push(this.block.serializeBlock());

            } catch (exception){
                Log.error("Error saving block", Log.LOG_TYPE.POOLS, this.block !== null ? this.block.toJSON() : '');
                console.log(exception);

            }

        }

        buffers.push( Serialization.serializeNumber1Byte( array.length > 0 ? 1 : 0 ));
        buffers = buffers.concat( array );

        return Buffer.concat( buffers );
    }


    async deserializeBlockInformation(buffer, offset = 0){

        let version = Serialization.deserializeNumber1Bytes( buffer, offset, );
        offset += 1;

        if (version === 0x00) return buffer.length;

        if (version >= 0x01){

            let height = Serialization.deserializeNumber4Bytes( buffer, offset, );
            offset +=4;

            this.height = height;
        }

        let length = Serialization.deserializeNumber4Bytes( buffer, offset, );
        offset +=4;

        this.blockInformationMinersInstances = [];

        this.totalDifficultyPOW = new BigNumber(0);
        this.totalDifficultyPOS = new BigNumber(0);

        console.info("Blocks Miner Instances", length);
        for (let i=0; i<length; i++){

            let blockInformationMinerInstance = new PoolDataBlockInformationMinerInstance(this.poolManagement, this, undefined);
            offset = blockInformationMinerInstance.deserializeBlockInformationMinerInstance(buffer, offset, version);

            if ( !blockInformationMinerInstance.minerInstance ) continue;

            if (blockInformationMinerInstance.minerInstanceTotalDifficultyPOS.isGreaterThan(0) || blockInformationMinerInstance.minerInstanceTotalDifficultyPOW.isGreaterThan(0))
                this.blockInformationMinersInstances.push(blockInformationMinerInstance);

        }
        this._calculateTimeRemaining();

        let payout = Serialization.deserializeNumber1Bytes( buffer, offset, );
        offset += 1;

        this.payout = payout === 1;

        let hasBlock = Serialization.deserializeNumber1Bytes( buffer, offset, );
        offset += 1;

        if (hasBlock === 1){

            this.block = this.poolManagement.blockchain.blockCreator.createEmptyBlock(0, undefined);

            let height = Serialization.deserializeNumber4Bytes( buffer, offset, );
            offset += 4;

            let difficultyTargetPrev = BufferExtended.substr(buffer, offset, 32);
            offset += 32;


            try {

                offset = this.block.deserializeBlock( buffer, height, undefined, difficultyTargetPrev, offset, false, false);
                this.block._difficultyTargetPrev = difficultyTargetPrev;

            } catch (exception){

                this.block = undefined;
                Log.error("Error Deserialize block", Log.LOG_TYPE.POOLS);
                offset = buffer.length;

            }
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

        if (!minerInstance ) throw {message: "minerInstance is undefined"};

        let blockInformationMinerInstance = this._findBlockInformationMinerInstance(minerInstance);
        if (blockInformationMinerInstance ) return blockInformationMinerInstance;


        blockInformationMinerInstance = new PoolDataBlockInformationMinerInstance(this.poolManagement, this, minerInstance, undefined, );
        this.blockInformationMinersInstances.push(blockInformationMinerInstance);

        return blockInformationMinerInstance;

    }

    _deleteBlockInformationMinerInstance(minerInstance){

        let pos = minerInstance;
        if (typeof pos !== "number")
            for (let i=this.blockInformationMinersInstances.length-1; i>=0; i--)
                if (this.blockInformationMinersInstances[i].minerInstance === minerInstance ) {
                    pos = i;
                    break;
                }

        this.blockInformationMinersInstances[pos].cancelReward();
        this.blockInformationMinersInstances[pos].cancelDifficulties();

        this.blockInformationMinersInstances.splice(pos,1);

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

        // reducing the timeRemaining with 2x
        this.timeRemaining = Math.max(0, Math.floor(  new BigNumber (  Math.floor( Blockchain.blockchain.blocks.networkHashRate)  ).dividedBy( this.poolManagement.poolStatistics.poolHashes ).dividedBy(2).multipliedBy( consts.BLOCKCHAIN.DIFFICULTY.TIME_PER_BLOCK ).toNumber()  ) )

    }


    set timeRemaining(newValue){

        this._timeRemaining = newValue;

        if (this.poolManagement.poolData.blocksInfo.length === 0 || this.poolManagement.poolData.lastBlockInformation === this)
            this.poolManagement.poolStatistics.poolTimeRemaining = newValue;

    }

}

export default PoolDataBlockInformation;