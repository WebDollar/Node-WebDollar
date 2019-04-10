import PPoWBlockchainBlockData from 'common/blockchain/ppow-blockchain/blocks/PPoW-Blockchain-Block-Data'
import InterfaceBlockchainBlockData from 'common/blockchain/interface-blockchain/blocks/Interface-Blockchain-Block-Data'
import BufferExtended from 'common/utils/BufferExtended'
import consts from 'consts/const_global'

let inheritBlockData

if (consts.POPOW_PARAMS.ACTIVATED) inheritBlockData = PPoWBlockchainBlockData
else inheritBlockData = InterfaceBlockchainBlockData

/**
 * It overrides the inheritedBlockData to introduce the Accountant Tree Hash
 */

class MiniBlockchainBlockData extends inheritBlockData {
  constructor (blockchain, minerAddress, transactions, hashTransactions, hashData, hashAccountantTree) {
    super(blockchain, minerAddress, transactions, hashTransactions, hashData)

    this.hashAccountantTree = hashAccountantTree

    if (this.hashAccountantTree === undefined) { this.computeAccountantTreeHashBlockData() }

    // recalculate hashData
    if (!hashData) { this.computeHashBlockData() }
  }

  async validateBlockData (height, blockValidation) {
    let result = await inheritBlockData.prototype.validateBlockData.call(this, height, blockValidation)

    if (!result) { return false }

    if (!this.hashAccountantTree || !Buffer.isBuffer(this.hashAccountantTree)) { throw { message: 'hashAccountantTree is empty' } }

    if (!blockValidation.blockValidationType['skip-validation'] && !blockValidation.blockValidationType['skip-accountant-tree-validation']) {
      // validate hashAccountantTree
      let hashAccountantTree = this.calculateAccountantTreeHashBlockData()

      if (!BufferExtended.safeCompare(hashAccountantTree, this.hashAccountantTree)) { throw { message: 'block.data hashAccountantTree is not right  ', hashAccountantTree: hashAccountantTree.toString('hex'), myHashAccoutantTree: this.hashAccountantTree.toString('hex') } }
    }

    return true
  }

  _computeBlockDataHeaderPrefix (onlyHeader = false) {
    if (!Buffer.isBuffer(this.hashAccountantTree) || this.hashAccountantTree.length !== 32) { this.computeAccountantTreeHashBlockData() }

    return Buffer.concat([
      inheritBlockData.prototype._computeBlockDataHeaderPrefix.call(this, onlyHeader),
      this.hashAccountantTree
    ])
  }

  calculateAccountantTreeHashBlockData () {
    return this.blockchain.accountantTree.root.hash
  }

  computeAccountantTreeHashBlockData () {
    this.hashAccountantTree = this.calculateAccountantTreeHashBlockData()
  }

  deserializeData (buffer, offset, onlyHeader = false) {
    offset = inheritBlockData.prototype.deserializeData.call(this, buffer, offset, onlyHeader)

    this.hashAccountantTree = BufferExtended.substr(buffer, offset, 32)
    offset += 32

    return offset
  }
}

export default MiniBlockchainBlockData
