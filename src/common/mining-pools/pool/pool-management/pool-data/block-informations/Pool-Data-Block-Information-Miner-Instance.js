const BigNumber = require ('bignumber.js');
import Serialization from 'common/utils/Serialization';
import BufferExtended from "common/utils/BufferExtended"
import consts from 'consts/const_global';
import BlockchainMiningReward from 'common/blockchain/global/Blockchain-Mining-Reward';
import Blockchain from "main-blockchain/Blockchain"

class PoolDataBlockInformationMinerInstance {

    constructor(poolManagement, blockInformation, minerInstance, minerTotalDifficulty){

        this.poolManagement = poolManagement;

        this.blockInformation = blockInformation;
        this.minerInstance = minerInstance;

        if ( minerTotalDifficulty === undefined )
            minerTotalDifficulty = BigNumber(0);

        this.minerTotalDifficulty = minerTotalDifficulty;
        this.reward = 0;

        this.workHash = undefined;
        this.workHashNonce = undefined;
        this.workBlock = undefined;

        this.minerInstanceTotalDifficulty = undefined;

    }

    async validateWorkHash(workHash, workNonce){

        //validate hash
        if ( Math.random() < this.poolManagement.poolSettings.poolPOWValidationProbability ){

            let hash = await this.workBlock.computeHash( workNonce );

            if ( ! BufferExtended.safeCompare(hash, workHash ) ) return false;

        }

        return true;

    }

    async wasBlockMined(){

        if ( (await this.workBlock.computeHash(this.workHashNonce)).compare(this.workBlock.difficultyTargetPrev) <= 0)
            return true;

        return false;
    }

    calculateDifficulty(){

        // target     =     maximum target / difficulty
        // difficulty =     maximum target / target
        this.minerInstanceTotalDifficulty = consts.BLOCKCHAIN.BLOCKS_MAX_TARGET.dividedToIntegerBy( new BigNumber ( "0x"+ this.workHash.toString("hex") ) );

    }

    adjustDifficulty(difficulty){

        this.minerTotalDifficulty  = this.minerTotalDifficulty.plus(difficulty);

        this.blockInformation.adjustBlockInformationDifficulty(difficulty);

        this.calculateReward();

    }

    calculateReward(){

        this.reward = this.blockInformation.totalDifficulty.dividedToIntegerBy( this.minerTotalDifficulty ) * BlockchainMiningReward.getReward( Blockchain.blockchain.blocks.length-1 ) * (1-this.poolManagement.poolSettings.poolFee);

    }

    serializeBlockInformationMinerInstance() {

        let list = [];

        return Buffer.concat([

            this.minerInstance.publicKey,
            Serialization.serializeNumber7Bytes(this.reward),
            Serialization.serializeBigNumber(this.minerTotalDifficulty),

        ]);

        return Buffer.concat(list);

    }

    deserializeBlockInformationMinerInstance(buffer, offset=0){

        let publicKey = BufferExtended.substr( buffer, offset, consts.ADDRESSES.PUBLIC_KEY.LENGTH );
        offset += consts.ADDRESSES.PUBLIC_KEY.LENGTH;

        this.minerInstance = this.poolManagement.poolData.getMinerInstanceByPublicKey(publicKey);

        this.reward = Serialization.deserializeNumber7Bytes( BufferExtended.substr( buffer, offset, 7 ) );
        offset += 7;

        let answer = Serialization.deserializeBigNumber(buffer, offset);
        this.minerTotalDifficulty = answer.number;
        this.offset = answer.newOffset;

        return offset;

    }

}

export default PoolDataBlockInformationMinerInstance;