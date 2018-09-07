import BlockchainGenesis from 'common/blockchain/global/Blockchain-Genesis'
import InterfaceBlockchainBlock from 'common/blockchain/interface-blockchain/blocks/Interface-Blockchain-Block'
import consts from "consts/const_global"

class InterfaceBlockchainBlockTimestamp {

    constructor(blockchain){

        this.blockchain = blockchain;

    }

    getMedianTimestamp (height, blockValidation){

        let callback;
        if (blockValidation !== undefined)  callback = blockValidation.getTimeStampCallback;
        else callback = this.blockchain.getTimeStamp;

        let medianTimestamp = 0;

        for (let i = height-1; i >= height - consts.BLOCKCHAIN.TIMESTAMP.VALIDATION_NO_BLOCKS; i--)
            medianTimestamp += callback(i+1);

        return medianTimestamp / consts.BLOCKCHAIN.TIMESTAMP.VALIDATION_NO_BLOCKS;
    }

    validateMedianTimestamp (timestamp, height, blockValidation){

        let medianTimestamp = this.getMedianTimestamp( height, blockValidation );

        if ( timestamp < medianTimestamp )
            throw {message: "Block Timestamp is not bigger than the previous 10 blocks", medianTimestamp: medianTimestamp };

        return true;
    }

    validateNetworkAdjustedTime(timeStamp){

        if ( timeStamp > this.blockchain.timestamp.networkAdjustedTime - BlockchainGenesis.timeStampOffset + consts.BLOCKCHAIN.TIMESTAMP.NETWORK_ADJUSTED_TIME_MAXIMUM_BLOCK_OFFSET )
            throw { message: "Timestamp of block is less than the network-adjusted time", timeStamp: timeStamp, " > ": this.blockchain.timestamp.networkAdjustedTime - BlockchainGenesis.timeStampOffset + consts.BLOCKCHAIN.TIMESTAMP.NETWORK_ADJUSTED_TIME_MAXIMUM_BLOCK_OFFSET, networkAdjustedTime: this.blockchain.timestamp.networkAdjustedTime, NETWORK_ADJUSTED_TIME_MAXIMUM_BLOCK_OFFSET: consts.BLOCKCHAIN.TIMESTAMP.NETWORK_ADJUSTED_TIME_MAXIMUM_BLOCK_OFFSET }

        return true;
    }

}

export default InterfaceBlockchainBlockTimestamp;