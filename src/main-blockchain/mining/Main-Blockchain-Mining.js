
import MiniBlockchainMining from 'common/blockchain/mini-blockchain/Mini-Blockchain-Mining'

class MainBlockchainMining extends MiniBlockchainMining {
  constructor (blockchain, minerAddress) {
    super(blockchain, minerAddress)

    this.blockchain.mining = this
    this.blockchain.miningSolo = this
  }

  startMining () {
    console.log('Mining started')
    MiniBlockchainMining.prototype.startMining.call(this)
  }

  stopMining () {
    console.log('Mining Stopped')
    MiniBlockchainMining.prototype.stopMining.call(this)
  }
}

export default MainBlockchainMining
