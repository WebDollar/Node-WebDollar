import Serialization from 'common/utils/Serialization';

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

        if (work === undefined) throw {message: "work is undefined"};
        if ( Buffer.isBuffer(work.hash) || work.hash.length !== consts.BLOCKCHAIN.BLOCKS_POW_LENGTH) throw {message: "hash is invalid"};

        if (minerInstance){

            //validate hash
            if (Math.random() < this.poolWorkManagement.poolSettings.poolPOWValidationProbability ){

                let hash = await minerInstance.work.block.computeHash( work.bestNonce );

                if ( ! BufferExtended.safeCompare(hash, work.bestHash ) )
                {message: "work.hash is invalid"}

            }

            minerInstance.work.hash = work.hash;
            let reward = this.updateRewards(minerInstance);

            return {work: this.generatePoolWork(), reward: reward };
        }


    }

}

export default PoolBlocksManagement;