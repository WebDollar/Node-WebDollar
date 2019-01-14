const BigNumber = require ('bignumber.js');
import Serialization from 'common/utils/Serialization';
import BufferExtended from "common/utils/BufferExtended"
import consts from 'consts/const_global';
import BlockchainMiningReward from 'common/blockchain/global/Blockchain-Mining-Reward';
import Blockchain from "main-blockchain/Blockchain"
import Utils from "common/utils/helpers/Utils";
import BlockchainGenesis from 'common/blockchain/global/Blockchain-Genesis';

class PoolDataBlockInformationMinerInstance {

    constructor(poolManagement, blockInformation, minerInstance, minerInstanceTotalDifficulty){

        this.poolManagement = poolManagement;

        this.blockInformation = blockInformation;
        this.minerInstance = minerInstance;

        this._reward = 0;
        this.rewardForReferral = 0;
        this._prevRewardInitial = 0;

        this._workHash = undefined;
        this.workHashNonce = undefined;
        this.workBlock = undefined;

        this._workDifficulty = undefined;

        this.addresses = []; //received by pool for POS balances to be sent

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

    async validateWorkHash(prevBlock, workHash){

        prevBlock = (prevBlock || this.workBlock);

        //validate hash
        let hash = await  prevBlock.computeHash.apply(  prevBlock, Array.prototype.slice.call( arguments, 2 ) );

        if ( ! BufferExtended.safeCompare(hash, workHash ) ) return false;

        return true;

    }

    async wasBlockMined(){

        if ( (await this.workBlock.computeHash.apply(this.workBlock, arguments)).compare(this.workBlock.difficultyTargetPrev) <= 0)
            return true;

        return false;
    }

    calculateDifficulty(workHash){

        //POS difficulty
        if (BlockchainGenesis.isPoSActivated(this.workBlock.height)){

            if ( !workHash )
                workHash = this.posMinerAddressBalance.toString();

            this._workDifficulty = new BigNumber( workHash );

        } else { //POW difficulty

            if ( !workHash )
                workHash = this._workHash;

            // target     =     maximum target / difficulty
            // difficulty =     maximum target / target

            this._workDifficulty = consts.BLOCKCHAIN.BLOCKS_MAX_TARGET.dividedBy( new BigNumber ( "0x"+ workHash.toString("hex") ) );

        }

    }

    adjustDifficulty(difficulty, useDeltaTime = false ){

        if (difficulty === undefined) difficulty = this._workDifficulty;

        //POS difficulty
        if (BlockchainGenesis.isPoSActivated(this.workBlock.height)){

            this.blockInformation.adjustBlockInformationDifficultyBestTarget( difficulty, this.minerInstanceTotalDifficulty );
            this.minerInstanceTotalDifficulty = difficulty;

            this.calculateReward( useDeltaTime );

        } else { //POW difficulty

            if (this.minerInstanceTotalDifficulty.isLessThan(difficulty)) {

                this.blockInformation.adjustBlockInformationDifficultyBestTarget( difficulty, this.minerInstanceTotalDifficulty );
                this.minerInstanceTotalDifficulty = difficulty;

                this.calculateReward( useDeltaTime );
            }

        }

    }

    calculateReward(useDeltaTime = false){

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


        let reward =  this.minerInstanceTotalDifficulty.dividedBy( this.blockInformation.totalDifficulty ).multipliedBy(ratio).multipliedBy( BlockchainMiningReward.getReward( height )  ).multipliedBy( 1-this.poolManagement.poolSettings.poolFee).toNumber();

        if ( this.miner.referrals.referralLinkMiner !== undefined && this.poolManagement.poolSettings.poolReferralFee > 0) {

            this.rewardForReferral = reward * ( this.poolManagement.poolSettings.poolReferralFee);
            this.miner.referrals.referralLinkMiner.rewardReferralTotal += this.rewardForReferral - this._prevRewardInitial * this.poolManagement.poolSettings.poolReferralFee;

        }

        this.reward = Math.max( 0 , Math.floor ( reward * ( 1 - this.poolManagement.poolSettings.poolReferralFee) ) );
        let prevReward = Math.max( 0 , Math.floor ( this._prevRewardInitial * ( 1 - this.poolManagement.poolSettings.poolReferralFee) ) );
        this.minerInstance.miner.rewardTotal += this._reward - prevReward;

        this._prevRewardInitial = reward;
        
        return this._reward;
    }

    cancelReward(){

        this.minerInstance.miner.rewardTotal -= this.reward;
        this.reward = 0;

        if ( this.miner.referrals.referralLinkMiner !== undefined && this.poolManagement.poolSettings.poolReferralFee > 0)
            this.miner.referrals.referralLinkMiner.rewardReferralTotal -= this._prevRewardInitial * ( this.poolManagement.poolSettings.poolReferralFee) ;

        this._prevRewardInitial = 0;

    }

    serializeBlockInformationMinerInstance() {

        return Buffer.concat([

            this.minerInstance.address,
            Serialization.serializeBigNumber(this.minerInstanceTotalDifficulty),

        ]);

    }

    deserializeBlockInformationMinerInstance(buffer, offset=0, version){

        let address;

        //TODO: to be removed

        if (version === 0x01) {

            let adr = BufferExtended.substr(buffer, offset, consts.ADDRESSES.PUBLIC_KEY.LENGTH);
            offset += consts.ADDRESSES.PUBLIC_KEY.LENGTH;

            address = new Buffer(1);

            for (let i=0; i< this.poolManagement.poolData.miners.length; i++)
                if (this.poolManagement.poolData.miners[i].publicKeys !== undefined)
                    for (let j=0; j<this.poolManagement.poolData.miners[i].publicKeys.length; j++)
                        if (this.poolManagement.poolData.miners[i].publicKeys[j].equals(adr)){

                            address = this.poolManagement.poolData.miners[i].address;
                            break;

                        }

        } else {

            address = BufferExtended.substr(buffer, offset, consts.ADDRESSES.ADDRESS.LENGTH);
            offset += consts.ADDRESSES.ADDRESS.LENGTH;

        }


        let miner = this.poolManagement.poolData.findMiner( address );
        if (miner !== undefined && miner !== null) {
            this.minerInstance = miner.addInstance({
                _diff: Math.random(),
                node: {
                    protocol: {}
                }
            });
        }

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


    set reward(newValue){
        this._reward = newValue;
    }

    get reward(){
        return this._reward;
    }

}

export default PoolDataBlockInformationMinerInstance;