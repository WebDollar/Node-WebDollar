import InterfaceBlockchainBrowserMining from 'common/blockchain/interface-blockchain/mining/browser/Interface-Blockchain-Browser-Mining'
import InterfaceBlockchainBlock from 'common/blockchain/interface-blockchain/blocks/Interface-Blockchain-Block'
import consts from 'consts/const_global'

class PoolBrowserMining extends InterfaceBlockchainBrowserMining {
  constructor (blockchain, minerAddress, miningFeePerByte) {
    super(blockchain, minerAddress, miningFeePerByte)

    this.useResetConsensus = false
  }
}

export default PoolBrowserMining
