const BigNumber = require ('bignumber.js');
import Serialization from 'common/utils/Serialization';
import BufferExtended from "common/utils/BufferExtended"
import consts from 'consts/const_global';
import BlockchainMiningReward from 'common/blockchain/global/Blockchain-Mining-Reward';
import Blockchain from "main-blockchain/Blockchain"

class PoolDataBlockInformationMinerInstance {

    constructor(poolManagement, blockInformation, minerInstance, minerInstanceTotalDifficulty){

        this.poolManagement = poolManagement;

        this.blockInformation = blockInformation;
        this.minerInstance = minerInstance;

        this.reward = 0;

        this._workHash = undefined;
        this.workHashNonce = undefined;
        this.workBlock = undefined;

        this._workDifficulty = undefined;

        if ( minerInstanceTotalDifficulty === undefined )
            minerInstanceTotalDifficulty = BigNumber(0);

        this.minerInstanceTotalDifficulty = minerInstanceTotalDifficulty;
        this.socket = undefined;

    }

    destroyBlockInformationMinerInstance(){

        this.poolManagement = undefined;
        this.blockInformation = undefined;
        this.minerInstance = undefined;

        if (this.workBlock !== undefined)
            this.workBlock.destroyBlock();

        this.workBlock = undefined;

    }

    async validateWorkHash(workHash, workNonce){

        //validate hash
        let hash = await this.workBlock.computeHash( workNonce );

        if ( ! BufferExtended.safeCompare(hash, workHash ) ) return false;

        return true;

    }

    async wasBlockMined(){

        if ( (await this.workBlock.computeHash(this.workHashNonce)).compare(this.workBlock.difficultyTargetPrev) <= 0)
            return true;

        return false;
    }

    calculateDifficulty(workHash){

        if (workHash === undefined) workHash = this._workHash;

        // target     =     maximum target / difficulty
        // difficulty =     maximum target / target

        this._workDifficulty = consts.BLOCKCHAIN.BLOCKS_MAX_TARGET.dividedBy( new BigNumber ( "0x"+ workHash.toString("hex") ) );

    }

    adjustDifficulty(difficulty, useDeltaTime = false ){

        if (difficulty === undefined) difficulty = this._workDifficulty;

        this.minerInstanceTotalDifficulty  = this.minerInstanceTotalDifficulty.plus(difficulty);

        this.blockInformation.adjustBlockInformationDifficulty(difficulty);

        this.calculateReward(useDeltaTime );

    }

    calculateReward(useDeltaTime = false, skipRewardTotal=false){

        this.prevReward = this.reward;

        let height;

        if ( this.blockInformation.block !== undefined ) height = this.blockInformation.block.height;
        else if ( this.workBlock !== undefined) height = this.workBlock.height;
        else if (Blockchain.blockchain.blocks.length > 0) height = Blockchain.blockchain.blocks.length-1;
        else height = 100000;

        let ratio = 1;

        if (useDeltaTime) {

            let diff = Math.floor( (new Date().getTime() - this.blockInformation.date)/1000);

            if (diff > 0 && this.blockInformation._timeRemaining > 0)
                ratio = new BigNumber( diff).dividedBy( diff + this.blockInformation._timeRemaining );
        }

        this.reward = Math.floor ( this.minerInstanceTotalDifficulty.dividedBy( this.blockInformation.totalDifficulty ).multipliedBy(ratio).multipliedBy( BlockchainMiningReward.getReward( height ) - consts.MINING_POOL.MINING.FEE_THRESHOLD ).multipliedBy( 1-this.poolManagement.poolSettings.poolFee).toNumber());

        if (!skipRewardTotal)
            this.minerInstance.miner.rewardTotal += this.reward - this.prevReward;

        return this.reward;
    }

    cancelReward(){

        this.minerInstance.miner.rewardTotal -= this.reward;
        this.reward = 0;

    }

    serializeBlockInformationMinerInstance() {

        return Buffer.concat([

            this.minerInstance.publicKey || new Buffer(consts.ADDRESSES.PUBLIC_KEY.LENGTH),
            Serialization.serializeBigNumber(this.minerInstanceTotalDifficulty),

        ]);

    }

    deserializeBlockInformationMinerInstance(buffer, offset=0){

        let publicKey = BufferExtended.substr( buffer, offset, consts.ADDRESSES.PUBLIC_KEY.LENGTH );
        offset += consts.ADDRESSES.PUBLIC_KEY.LENGTH;

        this.minerInstance = this.poolManagement.poolData.getMinerInstanceByPublicKey(publicKey);

        let answer = Serialization.deserializeBigNumber(buffer, offset);
        this.minerInstanceTotalDifficulty = answer.number;
        offset = answer.newOffset;

        return offset;

    }

    get address(){
        return this.minerInstance.miner.address;
    }

    get minerAddress(){
        return this.address;
    }

    get miner(){
        return this.minerInstance.miner;
    }

    set workHash(newValue){

        this._workHash = newValue;

        if (this.blockInformation.bestHash === undefined || newValue.compare(this.blockInformation.bestHash) <= 0)
            this.blockInformation.bestHash = newValue;

    }

    get workHash(){

        return this._workHash;

    }

}

export default PoolDataBlockInformationMinerInstance;