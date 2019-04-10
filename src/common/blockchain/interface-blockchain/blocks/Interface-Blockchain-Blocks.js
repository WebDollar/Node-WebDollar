import consts from 'consts/const_global'
import StatusEvents from 'common/events/Status-Events'
import BlockchainGenesis from 'src/common/blockchain/global/Blockchain-Genesis'

import Serialization from 'common/utils/Serialization'
import InterfaceBlockchainBlockTimestamp from './../blocks/Interface-Blockchain-Block-Timestamp'
import WebDollarCrypto from '../../../crypto/WebDollar-Crypto'

import SavingManager from 'common/blockchain/utils/saving-manager/Saving-Manager'
import LoadingManager from 'common/blockchain/utils/loading-manager/Loading-Manager'
import Log from '../../../utils/logging/Log'
import NodeBlockchainPropagation from '../../../sockets/protocol/propagation/Node-Blockchain-Propagation'

const BigInteger = require('big-integer')
const BigNumber = require('bignumber.js')

/**
 * It creates like an Array of Blocks. In case the Block doesn't exist, it will be stored as `undefined`
 **/

class InterfaceBlockchainBlocks {
  constructor (blockchain, db) {
    this.blockchain = blockchain

    this.db = db

    this.blocksStartingPoint = 0
    this._length = 0
    this.chainWork = BigInteger(0)
    this.chainWorkSerialized = new Buffer(0)

    this._networkHashRate = 0

    this.timestampBlocks = new InterfaceBlockchainBlockTimestamp(blockchain)

    this.savingManager = new SavingManager(this.blockchain)
    this.loadingManager = new LoadingManager(this.blockchain, this.savingManager)

    this.last = undefined
    this.first = undefined
  }

  async addBlock (block, revertActions, saveBlock, showUpdate = true, socketsAvoidBroadcast) {
    this.savingManager.addBlockToSave(block)
    await this.emitBlockInserted(block)

    NodeBlockchainPropagation.propagateBlock(block, socketsAvoidBroadcast)

    await this.setLength(this.length + 1)

    if (revertActions) { revertActions.push({ name: 'block-added', height: this.length - 1 }) }

    if (showUpdate) { this.emitBlockCountChanged() }
  }

  async emitBlockInserted (block) {
    StatusEvents.emit('blockchain/block-inserted', block || await this.last)
  }

  emitBlockCountChanged () {
    StatusEvents.emit('blockchain/blocks-count-changed', this._length)
  }

  async spliceBlocks (after, showUpdate = true) {
    await this.setLength(after)

    if (showUpdate) { this.emitBlockCountChanged() }
  }

  async clearBlocks () {
    return this.spliceBlocks(0, true)
  }

  get endingPosition () {
    // full node
    return this.length
  }

  async recalculateNetworkHashRate () {
    let MaxTarget = consts.BLOCKCHAIN.BLOCKS_MAX_TARGET
    let diff

    let SumDiffPoS = new BigNumber(0)
    let SumDiffPoW = new BigNumber(0)

    let last, first
    for (let i = Math.max(this.blockchain.blocks.blocksStartingPoint, Math.max(0, this.blockchain.blocks.endingPosition - consts.BLOCKCHAIN.DIFFICULTY.NO_BLOCKS * 3)); i < this.blockchain.blocks.endingPosition; i++) {
      let block = await this.blockchain.getBlock(i)

      if (i < 0) continue
      diff = MaxTarget.dividedBy(new BigNumber('0x' + block.difficultyTarget.toString('hex')))

      if (BlockchainGenesis.isPoSActivated(block.height)) { SumDiffPoS = SumDiffPoS.plus(diff) } else { SumDiffPoW = SumDiffPoW.plus(diff) }

      if (!first) first = i
      last = i
    }

    let how_much_it_took_to_mine_X_Blocks = await this.blockchain.getTimeStamp(last) - await this.blockchain.getTimeStamp(first)
    let answer

    if (BlockchainGenesis.isPoSActivated(this.blockchain.blocks.length - 1)) { answer = SumDiffPoS.dividedToIntegerBy(new BigNumber(how_much_it_took_to_mine_X_Blocks.toString())).toFixed(13) } else { answer = SumDiffPoW.dividedToIntegerBy(new BigNumber(how_much_it_took_to_mine_X_Blocks.toString())).toFixed(13) }

    this.networkHashRate = parseFloat(answer)
    return parseFloat(answer)
  }

  set networkHashRate (newValue) {
    this._networkHashRate = newValue
    StatusEvents.emit('blockchain/new-network-hash-rate', this._networkHashRate)
  }

  get networkHashRate () {
    return this._networkHashRate
  }

  async setLength (newValue) {
    this._length = newValue

    this.chainWork = await this.loadingManager.getChainWork(newValue - 1)
    this.chainWorkSerialized = Serialization.serializeBigInteger(this.chainWork)

    this.last = await this.loadingManager.getBlock(newValue - 1)
  }

  get length () {
    return this._length
  }

  async readBlockchainLength () {
    let length = await this.loadingManager.readBlockchainLength()
    if (!length) return false

    await this.setLength(length)
  }

  async saveBlockchainLength (length = this.length) {
    return this.savingManager.saveBlockchainLength(length)
  }
}

export default InterfaceBlockchainBlocks
