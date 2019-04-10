import Serialization from 'common/utils/Serialization'
import BufferExtended from 'common/utils/BufferExtended'
import consts from 'consts/const_global'
import BlockchainMiningReward from 'common/blockchain/global/Blockchain-Mining-Reward'
import Blockchain from 'main-blockchain/Blockchain'
import Utils from 'common/utils/helpers/Utils'
import BlockchainGenesis from 'common/blockchain/global/Blockchain-Genesis'
const BigNumber = require('bignumber.js')

class PoolDataBlockInformationMinerInstance {
  constructor (poolManagement, blockInformation, minerInstance) {
    this.poolManagement = poolManagement

    this.blockInformation = blockInformation
    this.minerInstance = minerInstance

    this._reward = 0
    this.rewardForReferral = 0
    this._prevRewardInitial = 0

    this.addresses = [] // received by pool for POS balances to be sent

    // current block

    this.reset()

    this._lastHeight = 60 // avoid genesis wallets

    this.socket = undefined
  }

  reset () {
    this.minerInstanceTotalDifficultyPOW = BigNumber(0)
    this.minerInstanceTotalDifficultyPOS = BigNumber(0)

    this._minerInstanceTotalDifficultiesPOW = {
    }
    this._minerInstanceTotalDifficultiesPOS = {
    }
  }

  destroyBlockInformationMinerInstance () {
    this.poolManagement = undefined
    this.blockInformation = undefined
    this.minerInstance = undefined
  }

  async validateWorkHash (prevBlock, workHash) {
    // validate hash
    let hash = await prevBlock.computeHash.apply(prevBlock, Array.prototype.slice.call(arguments, 2))

    if (!BufferExtended.safeCompare(hash, workHash)) return false

    return true
  }

  async wasBlockMined (prevBlock) {
    if ((await prevBlock.computeHash.apply(prevBlock, Array.prototype.slice.call(arguments, 1))).compare(prevBlock.difficultyTargetPrev) <= 0) { return true }

    return false
  }

  // for POW work is workHash
  // for POS work is number of coins
  calculateDifficulty (prevBlock, workDone) {
    // POS difficulty
    if (BlockchainGenesis.isPoSActivated(prevBlock.height)) {
      workDone = workDone.toString()

      return new BigNumber(workDone)
    } else { // POW difficulty
      // target     =     maximum target / difficulty
      // difficulty =     maximum target / target

      return consts.BLOCKCHAIN.BLOCKS_MAX_TARGET.dividedBy(new BigNumber('0x' + workDone.toString('hex')))
    }
  }

  adjustDifficulty (prevBlock, difficulty, useDeltaTime = false, calculateReward = true, blockInformationFirstMinerInstance) {
    let height = Number.parseInt(prevBlock.height)

    if (!blockInformationFirstMinerInstance) { blockInformationFirstMinerInstance = this.blockInformation.findFirstMinerInstance(this.address) }

    // POS difficulty
    if (BlockchainGenesis.isPoSActivated(height)) {
      if (blockInformationFirstMinerInstance.penalty) { return }

      // it is already another instance
      let prevDifficulty = blockInformationFirstMinerInstance._minerInstanceTotalDifficultiesPOS[height] || BigNumber(0)

      if (prevDifficulty.isLessThan(difficulty)) {
        this.blockInformation.adjustBlockInformationDifficultyBestTarget(difficulty, prevDifficulty, height, true)

        blockInformationFirstMinerInstance.minerInstanceTotalDifficultyPOS = blockInformationFirstMinerInstance.minerInstanceTotalDifficultyPOS.plus(difficulty.minus(prevDifficulty))
        blockInformationFirstMinerInstance._minerInstanceTotalDifficultiesPOS[height] = difficulty
      }
    } else { // POW difficulty
      // it is already another instance
      let prevDifficulty = blockInformationFirstMinerInstance._minerInstanceTotalDifficultiesPOW[height] || BigNumber(0)

      if (prevDifficulty.isLessThan(difficulty)) {
        this.blockInformation.adjustBlockInformationDifficultyBestTarget(difficulty, prevDifficulty, height, true)

        blockInformationFirstMinerInstance.minerInstanceTotalDifficultyPOW = blockInformationFirstMinerInstance.minerInstanceTotalDifficultyPOW.plus(difficulty.minus(prevDifficulty))
        blockInformationFirstMinerInstance._minerInstanceTotalDifficultiesPOW[height] = difficulty
      }
    }

    if (calculateReward) { this.calculateReward(useDeltaTime) }

    this._lastHeight = Math.max(this._lastHeight, height)
  }

  cancelDifficulties (workType) {
    if (!workType || workType === 'pow') {
      for (let height in this._minerInstanceTotalDifficultiesPOW) { this.blockInformation.adjustBlockInformationDifficultyBestTarget(BigNumber(0), this._minerInstanceTotalDifficultiesPOW[height], height, false) }
      this._minerInstanceTotalDifficultiesPOW = {}
      this.minerInstanceTotalDifficultyPOW = BigNumber(0)
    }

    if (!workType || workType === 'pos') {
      for (let height in this._minerInstanceTotalDifficultiesPOS) { this.blockInformation.adjustBlockInformationDifficultyBestTarget(BigNumber(0), this._minerInstanceTotalDifficultiesPOS[height], height, false) }
      this._minerInstanceTotalDifficultiesPOS = {}
      this.minerInstanceTotalDifficultyPOS = BigNumber(0)
    }
  }

  calculateReward (useDeltaTime = false) {
    let ratio = 1

    if (useDeltaTime) {
      let diff = Math.floor((new Date().getTime() - this.blockInformation.date) / 1000)

      if (diff > 0 && this.blockInformation._timeRemaining > 0) {
        if (diff + this.blockInformation._timeRemaining !== 0) { ratio = new BigNumber(diff).dividedBy(diff + this.blockInformation._timeRemaining * 10) } else { ratio = new BigNumber(diff) }
      }

      if (ratio > 1) ratio = 1
    }

    let rewardPOW = BigNumber(0)
    if (this.blockInformation.totalDifficultyPOW.isGreaterThan(0)) { rewardPOW = this.minerInstanceTotalDifficultyPOW.dividedBy(this.blockInformation.totalDifficultyPOW).multipliedBy(this.blockInformation.miningHeights.blocksPow).dividedBy(this.blockInformation.miningHeights.blocksPow + this.blockInformation.miningHeights.blocksPos) }

    let rewardPOS = BigNumber(0)
    if (this.blockInformation.totalDifficultyPOS.isGreaterThan(0)) { rewardPOS = this.minerInstanceTotalDifficultyPOS.dividedBy(this.blockInformation.totalDifficultyPOS).multipliedBy(this.blockInformation.miningHeights.blocksPos).dividedBy(this.blockInformation.miningHeights.blocksPow + this.blockInformation.miningHeights.blocksPos) }

    let rewardDifficulty = rewardPOW.plus(rewardPOS)

    let reward = rewardDifficulty.multipliedBy(ratio).multipliedBy(BlockchainMiningReward.getReward(this._lastHeight)).multipliedBy(1 - this.poolManagement.poolSettings.poolFee).toNumber()

    let prevReward
    if (this.miner.referrals.referralLinkMiner && this.poolManagement.poolSettings.poolReferralFee > 0) {
      this.rewardForReferral = reward * this.poolManagement.poolSettings.poolReferralFee
      this.miner.referrals.referralLinkMiner.rewardReferralTotal += this.rewardForReferral - this._prevRewardInitial * this.poolManagement.poolSettings.poolReferralFee

      this.reward = Math.max(0, Math.floor(reward * (1 - this.poolManagement.poolSettings.poolReferralFee)))
      prevReward = Math.max(0, Math.floor(this._prevRewardInitial * (1 - this.poolManagement.poolSettings.poolReferralFee)))
    } else {
      this.reward = Math.max(0, Math.floor(reward))
      prevReward = Math.max(0, Math.floor(this._prevRewardInitial))
    }

    this.minerInstance.miner.rewardTotal += this._reward - prevReward

    this._prevRewardInitial = reward

    return this._reward
  }

  cancelReward () {
    this.minerInstance.miner.rewardTotal -= this.reward
    this.reward = 0

    if (this.miner.referrals.referralLinkMiner && this.poolManagement.poolSettings.poolReferralFee > 0) { this.miner.referrals.referralLinkMiner.rewardReferralTotal -= this._prevRewardInitial * (this.poolManagement.poolSettings.poolReferralFee) }

    this._prevRewardInitial = 0
  }

  serializeBlockInformationMinerInstance () {
    let buffers = [
      this.minerInstance.address
    ]

    let pow = []; let pos = []

    for (let height in this._minerInstanceTotalDifficultiesPOW) {
      pow.push(Serialization.serializeNumber3Bytes(Number.parseInt(height)))
      pow.push(Serialization.serializeBigNumber(this._minerInstanceTotalDifficultiesPOW[ height ]))
    }
    buffers.push(Serialization.serializeNumber2Bytes(pow.length / 2))
    buffers = buffers.concat(pow)

    for (let height in this._minerInstanceTotalDifficultiesPOS) {
      pos.push(Serialization.serializeNumber3Bytes(Number.parseInt(height)))
      pos.push(Serialization.serializeBigNumber(this._minerInstanceTotalDifficultiesPOS[ height ]))
    }
    buffers.push(Serialization.serializeNumber2Bytes(pos.length / 2))
    buffers = buffers.concat(pos)

    return Buffer.concat(buffers)
  }

  deserializeBlockInformationMinerInstance (buffer, offset = 0, version) {
    let address

    if (version >= 0x02) {
      address = BufferExtended.substr(buffer, offset, consts.ADDRESSES.ADDRESS.LENGTH)
      offset += consts.ADDRESSES.ADDRESS.LENGTH
    }
    // console.log(version, "address", address.toString("hex"));

    let miner = this.poolManagement.poolData.findMiner(address)
    if (miner !== null) {
      this.minerInstance = miner.addInstance({
        _diff: Math.random(),
        node: {
          protocol: {

          }
        }
      })
    }

    if (version === 0x02) {
      // TODO to be removed
      let answer = Serialization.deserializeBigNumber(buffer, offset)
      offset = answer.newOffset
    } else if (version === 0x03) {
      let powLength = Serialization.deserializeNumber2Bytes(buffer, offset); offset += 2
      for (let i = 0; i < powLength; i++) {
        let height = Serialization.deserializeNumber3Bytes(buffer, offset); offset += 3
        let difficultyBigNumber = Serialization.deserializeBigNumber(buffer, offset); offset = difficultyBigNumber.newOffset
        let difficulty = difficultyBigNumber.number

        if (difficulty.isGreaterThan(0) && this.minerInstance) { this.adjustDifficulty({ height: height }, difficulty, false, false) }
      }

      let posLength = Serialization.deserializeNumber2Bytes(buffer, offset); offset += 2
      for (let i = 0; i < posLength; i++) {
        let height = Serialization.deserializeNumber3Bytes(buffer, offset); offset += 3
        let difficultyBigNumber = Serialization.deserializeBigNumber(buffer, offset); offset = difficultyBigNumber.newOffset
        let difficulty = difficultyBigNumber.number

        if (difficulty.isGreaterThan(0) && this.minerInstance) { this.adjustDifficulty({ height: height }, difficulty, false, false) }
      }
    }

    return offset
  }

  get addressWIF () {
    return this.minerInstance.miner.addressWIF
  }

  get address () {
    return this.minerInstance.miner ? this.minerInstance.miner.address : undefined
  }

  get minerAddress () {
    return this.address
  }

  get miner () {
    return this.minerInstance.miner
  }

  set workHash (newValue) {
    this._workHash = newValue

    if (!this.blockInformation.bestHash || newValue.compare(this.blockInformation.bestHash) <= 0) { this.blockInformation.bestHash = newValue }
  }

  get workHash () {
    return this._workHash
  }

  set reward (newValue) {
    this._reward = newValue
  }

  get reward () {
    return this._reward
  }
}

export default PoolDataBlockInformationMinerInstance
