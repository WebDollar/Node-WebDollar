import Serialization from 'common/utils/Serialization';
import BufferExtended from "common/utils/BufferExtended";
import consts from 'consts/const_global';

class PoolBlocksManagement{

    constructor(poolManagement, blockchain){

        this.poolManagement = poolManagement;
        this.blockchain = blockchain;

        this._lastBlock = undefined;
        this._lastBlockNonce = 0;

    }

    async getNextBlock(){

        this._lastBlock = await this.blockchain.mining.getNextBlock();
        this._lastBlockNonce = 0;

    }

    getWork(minerInstance){

        if (this._lastBlock === undefined || ( this._lastBlockNonce + minerInstance.hashesPerSecond ) > 0xFFFFFFFF )
            this._lastBlock = this.getNextBlock();

        let block = this._lastBlock;

        let serialization = Buffer.concat( [
            Serialization.serializeBufferRemovingLeadingZeros( Serialization.serializeNumber4Bytes(block.height) ),
            Serialization.serializeBufferRemovingLeadingZeros( block.difficultyTargetPrev ),
            block.computedBlockPrefix
        ]);

        let answer = {

            block: serialization,
            noncesStart: this._lastBlockNonce,
            noncesEnd: this._lastBlockNonce + minerInstance.hashesPerSecond,

        };

        this._lastBlockNonce += minerInstance.hashesPerSecond;

        minerInstance.work = answer;

        return answer;

    }

    async processWork(minerInstance, work){

        if (work === null || typeof work !== "object") throw {message: "work is undefined"};

        if ( Buffer.isBuffer(work.bestHash) || work.bestHash.length !== consts.BLOCKCHAIN.BLOCKS_POW_LENGTH) throw {message: "bestHash is invalid"};
        if ( typeof work.bestHashNonce !== "number" ) throw {message: "bestHashNonce is invalid"};

        return await this.poolManagement.poolData.lastBlockInformation.updateWorkBlockInformationMinerInstance(minerInstance, work);

    }

}

export default PoolBlocksManagement;