import WebDollarCrypto from 'common/crypto/WebDollar-Crypto'
import consts from 'consts/const_global'
import GZip from 'common/utils/GZip'

class PPoWBlockchainProofBasic {
  constructor (blockchain, blocks) {
    this.date = new Date()

    this.blockchain = blockchain

    this.blocks = blocks
    this.blocksIndex = {}

    this.hash = undefined

    this.proofSerialized = undefined
  }

  async getProofHeaders (starting, length) {
    let list = []
    for (let i = starting; i < Math.min(starting + length, this.blocks.length); i++) {
      try {
        let block = await this.blockchain.getBlock(i)
        list.push(block.getBlockHeader())
      } catch (exception) {
        console.error('Failed to retrieve block ', i, exception)
        try {
          console.error('Failed to retrieve block ', this.blocks[i] ? this.blocks[i].toJSON() : 'block is null')
        } catch (exception) {

        }
      }
    }

    return list
  }

  async calculateProofSerialized () {
    let list = []

    for (let i = 0; i < this.blocks.length; i++) {
      let block = await this.blockchain.getBlock(this.blocks[i] + 1)
      list.push(this.serializeProof(block.getBlockHeader()))
    }

    this.proofSerialized = Buffer.concat(list)
    return this.proofSerialized
  }

  async calculateProofGzip () {
    this.proofGzip = await GZip.zip(this.proofSerialized)

    return this.proofGzip
  }

  validateProof (startingPoint = 0) {
    if (!Array.isArray(this.blocks)) { throw { message: 'proof blocks is invalid' } }

    for (let i = startingPoint; i < this.blocks.length; ++i) {
      if (!this.blocks[i]._validateInterlink()) { throw { message: 'validate Interlink Failed' } }
    }

    return true
  }

  validateProofLastElements (lastElements) {
    return this.validateProof(this.blocks.length - lastElements)
  }

  // TODO should be optimized using Object {}
  hasBlock (height) {
    for (let i = 0; i < this.blocks.length; i++) {
      if (this.blocks[i] === height) { return this.blocks[i] }
    }

    return null
  }

  equalsProofs (proofHash) {
    if (typeof proofHash === 'object' && proofHash.hasOwnProperty('hash')) proofHash = proofHash.hash

    if (proofHash.equals(this.hash)) { return true }

    return false
  }

  async calculateProofHash () {
    let buffers = []
    for (let i = 0; i < this.blocks.length; i++) { buffers.push(await this.blockchain.getDifficultyTarget(this.blocks[i])) }

    let buffer = Buffer.concat(buffers)

    this.hash = WebDollarCrypto.SHA256(buffer)

    return this.hash
  }

  get lastProofBlock () {
    return this.blocks[this.blocks.length - 1]
  }

  validatesLastBlock () {
    if (this.blocks.length <= 0 || this.blocks.length <= consts.POPOW_PARAMS.m) return false

    try {
      return true

      // let hashChain = await this.blockchain.getChainHash( this.blocks[this.blocks.length - 1] );
      //
      // if ( hashChain && hashChain.equals( await this.blockchain.getChainHash( this.blockchain.blocks.length - consts.POPOW_PARAMS.m - 1 ) ) )
      //     return true;
      // else
      //     return false;
    } catch (exception) {

    }
  }

  findBlockByHeight (height) {
    for (let i = 0; i < this.blocks.length; i++) {
      if (this.blocks[i].height === height) {
        return this.blocks[i]
      }
    }

    return null
  }

  push (block) {
    if (this.blocksIndex[block] === block) { return }

    this.blocks.push(block)
    this.blocksIndex[block] = block
  }
}

export default PPoWBlockchainProofBasic
