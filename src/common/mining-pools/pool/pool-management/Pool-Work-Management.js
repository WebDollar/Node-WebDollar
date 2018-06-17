import Serialization from 'common/utils/Serialization';
import BufferExtended from "common/utils/BufferExtended";
import consts from 'consts/const_global';
import Blockchain from "../../../../main-blockchain/Blockchain";

class PoolWorkManagement{

    constructor(poolManagement, blockchain){

        this.poolManagement = poolManagement;
        this.blockchain = blockchain;

        this._lastBlock = undefined;
        this._lastBlockNonce = 0;

    }

    async getNextBlock(){

        if (!Blockchain.synchronized)
            throw {message: "Blockchain is not yet synchronized"};

        this._lastBlock = await this.blockchain.mining.getNextBlock();
        this._lastBlockNonce = 0;

    }


    async getWork(minerInstance){

        let hashes = minerInstance.hashesPerSecond;
        if (hashes === undefined ) hashes = 500;

        if (this._lastBlock === undefined || ( this._lastBlockNonce + hashes ) > 0xFFFFFFFF )
            await this.getNextBlock();

        if (this._lastBlock.computedBlockPrefix === null )
            this._lastBlock._computeBlockHeaderPrefix();

        let serialization = Buffer.concat( [
            Serialization.serializeBufferRemovingLeadingZeros( Serialization.serializeNumber4Bytes(this._lastBlock.height) ),
            Serialization.serializeBufferRemovingLeadingZeros( this._lastBlock.difficultyTargetPrev ),
            this._lastBlock.computedBlockPrefix
        ]);

        let answer = {

            h: this._lastBlock.height,
            t: this._lastBlock.difficultyTargetPrev,
            s: this._lastBlock.computedBlockPrefix,

            start: this._lastBlockNonce,
            end: this._lastBlockNonce + hashes,

            serialization: serialization,
        };

        this._lastBlockNonce += hashes;

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

export default PoolWorkManagement;