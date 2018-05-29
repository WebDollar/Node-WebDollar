import Serialization from 'common/utils/Serialization';

class PoolBlocksManagement{

    constructor(blockchain){

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

}

export default PoolBlocksManagement;