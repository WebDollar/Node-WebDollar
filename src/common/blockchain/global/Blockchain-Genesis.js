import consts from 'consts/const_global'
import BufferExtended from "common/utils/BufferExtended"

class BlockchainGenesis{

    constructor(){

        this.hashPrev = new Buffer("7bb3e84e6892c7e76be2beedb94a1035b7f095d50b5462806b92be0cbccd31fc", "hex");

        this.timeStamp = 0;
        this.timeStampOffset = 1522846648;

        //this.difficultyTarget = new Buffer ( "00278112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb", "hex" ); //hard difficulty
        this.difficultyTarget = new Buffer ( "08898112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb", "hex" ); //hard difficulty

        this.address = BufferExtended.fromBase("WEBD$gBzsiV+$FARK8qSGqs09V6AEDBi#@fP6n7$"); // genesis address
    }

    validateGenesis(block){

        if ( block.timeStamp.length !== this.timeStamp.length )
            throw {message: "Timestamp doesn't match", timestamp: block.timeStamp};

        if ( block.timeStamp > 0x000FFFFF)
            throw {message: "Timestamp is too old ", timestamp: block.timeStamp};

        if (block.timeStamp < 0)
            throw {message: "Timestamp is invalid", timeStamp: block.timeStamp}
    }

    getLevel(){

        return consts.POPOW_PARAMS.BLOCKS_LEVEL_INFINITE;
    }

}

export default new BlockchainGenesis();