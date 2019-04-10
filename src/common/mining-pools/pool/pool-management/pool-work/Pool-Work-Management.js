import BufferExtended from 'common/utils/BufferExtended'

import Serialization from 'common/utils/Serialization'
import consts from 'consts/const_global'
import WebDollarCoins from 'common/utils/coins/WebDollar-Coins'
import RevertActions from 'common/utils/Revert-Actions/Revert-Actions'
import NodeBlockchainPropagation from 'common/sockets/protocol/propagation/Node-Blockchain-Propagation'
import PoolWork from './Pool-Work'
import StatusEvents from 'common/events/Status-Events'
import PoolNewWorkManagement from './Pool-New-Work-Management'
import BlockchainGenesis from 'common/blockchain/global/Blockchain-Genesis'

import PoolWorkValidation from './Pool-Work-Validation'

class PoolWorkManagement {
  constructor (poolManagement, blockchain) {
    this.poolManagement = poolManagement
    this.blockchain = blockchain

    this.poolNewWorkManagement = new PoolNewWorkManagement(poolManagement, this, blockchain)
    this.poolWorkValidation = new PoolWorkValidation(poolManagement, this)

    this.poolWork = new PoolWork(poolManagement, blockchain)

    this._rewardedAddresses = {}
  }

  startPoolWorkManagement () {
    this.poolWork.startGarbageCollector()
    this.poolWorkValidation.startPoolWorkValidation()
  }

  stopPoolWorkManagement () {
    this.poolWorkValidation.stopPoolWorkValidation()
    this.poolWork.stopGarbageCollector()
  }

  async getWork (minerInstance, blockInformationMinerInstance) {
    if (!minerInstance) throw { message: 'minerInstance is undefined' }

    let hashes = minerInstance.hashesPerSecond
    if (!hashes) hashes = 500

    if (!blockInformationMinerInstance) { blockInformationMinerInstance = this.poolManagement.poolData.lastBlockInformation.addBlockInformationMinerInstance(minerInstance) }

    await this.poolWork.lastBlockPromise // it's a promise, let's wait

    // if ( !this.poolWork.lastBlock || ( this.poolWork.lastBlockNonce + hashes ) > 0xFFFFFFFF  || ( this.poolWork.lastBlock.timeStamp + BlockchainGenesis.timeStampOffset < (new Date().getTime()/1000 - 300) ) )
    if (!this.poolWork.lastBlock || (this.poolWork.lastBlockNonce + hashes) > 0xFFFFFFFF) { await this.poolWork.getNextBlockForWork() } else if (!this.blockchain.semaphoreProcessing.processing && (this.poolWork.lastBlock.height !== this.blockchain.blocks.length || !this.poolWork.lastBlock.hashPrev.equals(this.blockchain.blocks.last.hash))) { await this.poolWork.getNextBlockForWork() }

    this.poolWork.lastBlockElement.instances[minerInstance.socket.node.sckAddress.uuid] = this.poolWork.lastBlock

    // for proof of stake it is necessary to know exactly the balance
    let balances

    let isPOS = BlockchainGenesis.isPoSActivated(this.poolWork.lastBlock.height)

    if (isPOS) {
      balances = []

      for (let i = 0; i < minerInstance.addresses.length; i++) { balances.push(await this._getMinerBalance(minerInstance.addresses[i])) }
    }

    let answer = {

      h: this.poolWork.lastBlock.height,
      t: this.poolWork.lastBlock.difficultyTargetPrev,
      s: this.poolWork.lastBlockSerialization,
      I: this.poolWork.lastBlockId,
      m: await this.blockchain.blocks.timestampBlocks.getMedianTimestamp(this.poolWork.lastBlock.height, this.poolWork.lastBlock.blockValidation),

      start: isPOS ? 0 : this.poolWork.lastBlockNonce,
      end: isPOS ? 0 : (this.poolWork.lastBlockNonce + hashes),

      b: isPOS ? balances : undefined

    }

    if (!isPOS) { this.poolWork.lastBlockNonce += hashes }

    minerInstance.lastBlockInformation = blockInformationMinerInstance
    minerInstance.workBlock = this.poolWork.lastBlock
    minerInstance.dateActivity = new Date().getTime() / 1000

    blockInformationMinerInstance.workBlock = this.poolWork.lastBlock

    if (this.poolManagement.poolSettings.poolUseSignatures) {
      let message = Buffer.concat([ this.poolWork.lastBlockSerialization, Serialization.serializeNumber4Bytes(answer.start), Serialization.serializeNumber4Bytes(answer.end) ])
      answer.sig = this.poolManagement.poolSettings.poolDigitalSign(message)
    }

    return answer
  }

  async processWork (minerInstance, work, prevBlock) {
    let result = false

    try {
      let wasBlockMined

      if (!minerInstance) throw { message: 'minerInstance is undefined' }
      if (!work || typeof work !== 'object') throw { message: 'work is undefined' }

      if (!Buffer.isBuffer(work.hash) || work.hash.length !== consts.BLOCKCHAIN.BLOCKS_POW_LENGTH) throw { message: 'hash is invalid' }
      if (typeof work.nonce !== 'number') throw { message: 'nonce is invalid' }

      let blockInformationMinerInstance = this.poolManagement.poolData.lastBlockInformation.addBlockInformationMinerInstance(minerInstance)

      if (!prevBlock) prevBlock = blockInformationMinerInstance.workBlock
      if (!prevBlock) throw { message: 'miner instance - no block' }

      let isPos = BlockchainGenesis.isPoSActivated(prevBlock.height)

      let args = []

      if (isPos) {
        work.nonce = 0
        work.pos.balance = await this._getMinerBalance(work.pos.posMinerAddress, prevBlock)
        args = [ work.pos.timestamp, work.pos.posMinerAddress, work.pos.balance ]
      } else {
        args = [work.nonce]
      }

      // TODO remove !isPOS to throw the error message always
      if (await blockInformationMinerInstance.validateWorkHash.apply(blockInformationMinerInstance, [ prevBlock, work.hash ].concat(args)) === false) {
        if (!isPos) { throw { message: 'block was incorrectly mined ' + (isPos ? 'pos' : 'pow'), work: work } }
      }

      if (Math.random() < 0.001) { console.log('Work: ', work) }

      if (isPos) {
        prevBlock.nonce = 0
        prevBlock.posSignature = work.pos.posSignature
        prevBlock.posMinerAddress = work.pos.posMinerAddress
        prevBlock.posMinerPublicKey = work.pos.posMinerPublicKey
        prevBlock.timeStamp = work.pos.timestamp
        prevBlock.verifyPOSSignature()

        if (!work.pos.posMinerAddress.equals(minerInstance.address)) { throw { message: "work.pos.posMinerAddress doesn't match", posMinerAddress: work.pos.posMinerAddress, minerInstance: minerInstance.address } }
      }

      // returning false, because a new fork was changed in the mean while
      if (!isPos && this.blockchain.blocks.length - 3 > prevBlock.height + 1) { throw { message: 'pool: block is already too old' } }

      if (isPos && this.blockchain.blocks.length - 3 > prevBlock.height + 1) { throw { message: 'pool: block is already too old' } }

      if (work.result) { // it is a solution and prevBlock is undefined
        try {
          wasBlockMined = await blockInformationMinerInstance.wasBlockMined.apply(blockInformationMinerInstance, [prevBlock].concat(args))
        } catch (exception) {
          wasBlockMined = false

          // TODO remove !isPOS to throw the error message always
          // TODO After the timestamp is used sent via the pool miners, this should be removed
          if (!isPos) { throw exception }
        }

        if (wasBlockMined) {
          console.warn('----------------------------------------------------------------------------')
          console.warn('----------------------------------------------------------------------------')
          console.warn('WebDollar Block was mined in Pool 2 ', prevBlock.height, ' nonce (', work.nonce + ')', work.hash.toString('hex'), ' reward', (prevBlock.reward / WebDollarCoins.WEBD), 'WEBD', prevBlock.data.minerAddress.toString('hex'))
          console.warn('----------------------------------------------------------------------------')
          console.warn('----------------------------------------------------------------------------')

          prevBlock.hash = work.hash
          prevBlock.nonce = work.nonce

          if (isPos) {
            prevBlock.nonce = 0
            prevBlock.posSignature = work.pos.posSignature
            prevBlock.posMinerAddress = work.pos.posMinerAddress
            prevBlock.posMinerPublicKey = work.pos.posMinerPublicKey
            prevBlock.timeStamp = work.pos.timestamp

            await prevBlock._validateBlockTimeStamp()
          }

          let revertActions = new RevertActions(this.blockchain)

          let block

          try {
            let serialization = await prevBlock.serializeBlock()
            block = await this.blockchain.blockCreator.createEmptyBlock(prevBlock.height, undefined)
            block.deserializeBlock(serialization, prevBlock.height, prevBlock.reward, await this.blockchain.getDifficultyTarget(prevBlock.height - 1))

            if (await this.blockchain.semaphoreProcessing.processSempahoreCallback(() => {
              // returning false, because a new fork was changed in the mean while
              if (this.blockchain.blocks.length !== block.height) { throw { message: 'pool: block is already too old for processing' } }

              // calculate blockHashChain
              block.hashChain = block.calculateChainHash()

              return this.blockchain.includeBlockchainBlock(block, false, 'all', true, revertActions)
            }) === false) throw { message: 'Mining2 returned false' }

            NodeBlockchainPropagation.propagateLastBlockFast(block)

            // confirming transactions
            await block.data.transactions.confirmTransactions(block.height)

            let blockInformation = blockInformationMinerInstance.blockInformation

            try {
              blockInformation.block = block
              blockInformation.height = block.height
            } catch (exception) {
              console.error('blockInformation block', exception)
            }

            this.poolManagement.poolData.addBlockInformation()

            StatusEvents.emit('blockchain/new-blocks', { })
          } catch (exception) {
            console.error('PoolWork include raised an exception', exception)
            await revertActions.revertOperations()
          }
        }
      } else {
        if (consts.DEBUG) { console.log('valid work, but not solution', prevBlock.height, work.pos ? work.pos.balance : '') }
      }

      let storeDifficulty

      // for testing only
      if (!consts.MINING_POOL.SKIP_POS_REWARDS && isPos) storeDifficulty = true
      else if (!consts.MINING_POOL.SKIP_POW_REWARDS && !isPos) storeDifficulty = true

      if (storeDifficulty) {
        let workDone
        if (isPos) workDone = work.pos.balance
        else {
          let target = prevBlock.difficultyTargetPrev.toString('hex').substr(2) + 'FF'
          target = Buffer.from(target, 'hex')

          if (work.hash.compare(target) <= 0) {
            work.hash = target
            work.nonce = -1
          }

          workDone = work.hash
        }

        let difficulty = blockInformationMinerInstance.calculateDifficulty(prevBlock, workDone)
        blockInformationMinerInstance.adjustDifficulty(prevBlock, difficulty, true, true)

        // be sure that none of the POS blocks were skipped
        // for debug it won't work
        if (isPos && !consts.DEBUG) {
          for (let i = 0; i < this.poolManagement.poolData.blocksInfo.length; i++) {
            let oldBlockInfo = this.poolManagement.poolData.blocksInfo[i]
            if (oldBlockInfo.payoutTransaction || oldBlockInfo.payout) continue

            for (let height in oldBlockInfo.miningHeights) {
              if (typeof oldBlockInfo.miningHeights[height] === 'object' && oldBlockInfo.miningHeights[height].isGreaterThan(0)) {
                if (BlockchainGenesis.isPoSActivated(height)) {
                  let oldBlockInformationMinerInstance = oldBlockInfo.addBlockInformationMinerInstance(blockInformationMinerInstance.minerInstance)

                  oldBlockInformationMinerInstance.adjustDifficulty({ height: height }, difficulty, true, true, oldBlockInformationMinerInstance)
                }
              }
            }
          }
        }

        // statistics
        this.poolManagement.poolStatistics.addStatistics(difficulty, minerInstance)
      }

      result = true
    } catch (exception) {
      if (exception.message === 'block was incorrectly mined' && Math.random() < 0.3) { console.error('Pool Work Management raised an error', exception) } else if (Math.random() < 0.05) { console.error('error pool mining', exception) }
    }

    return { result: result, reward: minerInstance.miner.rewardTotal, confirmed: minerInstance.miner.rewardConfirmedTotal, refReward: minerInstance.miner.referrals.rewardReferralsTotal, refConfirmed: minerInstance.miner.referrals.rewardReferralsConfirmed }
  }

  async _getMinerBalance (address, prevBlock = this.poolWork.lastBlock) {
    let balance = this.blockchain.accountantTree.getBalance(address)
    if (!balance) balance = 0

    // must be reverted
    // console.log("2 Before Balance ", balance); let s = "";
    for (let i = prevBlock.height - 1; i >= 0 && i >= prevBlock.height - 1 - consts.BLOCKCHAIN.POS.MINIMUM_POS_TRANSFERS; i--) {
      let block = await this.blockchain.getBlock(i)
      if (!block) continue

      // s += block.height + " ";

      for (let tx of block.data.transactions.transactions) {
        for (let from of tx.from.addresses) {
          if (from.unencodedAddress.equals(address)) { balance += from.amount }
        }

        for (let to of tx.to.addresses) {
          if (to.unencodedAddress.equals(address)) { balance -= to.amount }
        }
      }
    }

    // console.log("2 After Balance ", balance, s);

    return balance
  }
}

export default PoolWorkManagement
