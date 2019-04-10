import BlockchainGenesis from 'common/blockchain/global/Blockchain-Genesis'
import InterfaceBlockchainBlock from 'common/blockchain/interface-blockchain/blocks/Interface-Blockchain-Block'
import consts from 'consts/const_global'

// BITCOIN: A timestamp is accepted as valid if it is greater than the median timestamp of previous 11 blocks, and less than the network-adjusted time + 2 hours.

class InterfaceBlockchainBlockTimestamp {
  constructor (blockchain) {
    this.blockchain = blockchain
  }

  async getMedianTimestamp (height, blockValidation) {
    let callback
    if (blockValidation) callback = blockValidation.getTimeStampCallback
    else callback = this.blockchain.getTimeStamp

    let medianTimestamp = 0

    let no_blocks = consts.BLOCKCHAIN.TIMESTAMP.VALIDATION_NO_BLOCKS

    if (height >= consts.BLOCKCHAIN.HARD_FORKS.POS_ACTIVATION) { no_blocks = 2 }

    for (let i = height - 1; i >= height - no_blocks; i--) { medianTimestamp += await callback.call(this.blockchain, i) }

    return medianTimestamp / no_blocks
  }

  async validateMedianTimestamp (timestamp, height, blockValidation) {
    let medianTimestamp = await this.getMedianTimestamp(height, blockValidation)

    if (timestamp < medianTimestamp) { throw { message: 'Block Timestamp is not bigger than the previous 10 blocks', medianTimestamp: medianTimestamp } }

    return true
  }

  validateNetworkAdjustedTime (timeStamp, height) {
    let timestampValue = height < consts.BLOCKCHAIN.HARD_FORKS.POS_ACTIVATION ? consts.BLOCKCHAIN.TIMESTAMP.NETWORK_ADJUSTED_TIME_MAXIMUM_BLOCK_OFFSET : consts.BLOCKCHAIN.TIMESTAMP.NETWORK_ADJUSTED_TIME_MAXIMUM_BLOCK_OFFSET_AFTER_POS

    if (timeStamp > this.blockchain.timestamp.networkAdjustedTime - BlockchainGenesis.timeStampOffset + timestampValue) {
      throw { message: 'Timestamp of block is less than the network-adjusted time',
        timeStamp: timeStamp,
        ' > ': this.blockchain.timestamp.networkAdjustedTime - BlockchainGenesis.timeStampOffset + timestampValue,
        networkAdjustedTime: this.blockchain.timestamp.networkAdjustedTime,
        networkAdjustedTimeRelative: this.blockchain.timestamp.networkAdjustedTime - BlockchainGenesis.timeStampOffset,
        NETWORK_ADJUSTED_TIME_MAXIMUM_BLOCK_OFFSET: timestampValue }
    }

    return true
  }
}

export default InterfaceBlockchainBlockTimestamp
