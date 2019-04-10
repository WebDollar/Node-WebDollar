import BlockchainGenesis from './../../../common/blockchain/global/Blockchain-Genesis'
import Serialization from './../../../common/utils/Serialization'
import InterfaceBlockchainAddressHelper from './../../../common/blockchain/interface-blockchain/addresses/Interface-Blockchain-Address-Helper'
import BufferExtended from './../../../common/utils/BufferExtended'
import WebDollarCoins from './../../../common/utils/coins/WebDollar-Coins'

class BlockTransformer {
  constructor (oBlockDataHardForkProcessor, oTransactionTransformer) {
    this._oBlockDataHardForksProcessor = oBlockDataHardForkProcessor
    this._oTransactionTransformer = oTransactionTransformer
  }

  /**
     * @param {InterfaceBlockchainBlock|MiniBlockchainBlock} oBlock
     * @param {Object}                                       oOptions
     * @returns Object
     */
  async transform (oBlock, oOptions) {
    const bIsPosActivated = BlockchainGenesis.isPoSActivated(oBlock.height)
    const nBlockTimestampRaw = oBlock.timeStamp
    const nBlockTimestamp = nBlockTimestampRaw + BlockchainGenesis.timeStampOffset
    const oBlockTimestampUTC = new Date(nBlockTimestamp * 1000)
    const nBlockReward = oBlock.reward === null ? 0 : oBlock.reward
    const nTransactionsFee = oBlock.data.transactions.calculateFees()

    let oBlockData = {
      id: oBlock.height,
      block_id: oBlock.height,
      hash: oBlock.hash.toString('hex'),
      nonce: Serialization.deserializeNumber4Bytes_Positive(Serialization.serializeNumber4Bytes(oBlock.nonce)),
      nonce_raw: oBlock.nonce,
      version: oBlock.version,
      previous_hash: oBlock.hashPrev.toString('hex'),
      timestamp: oBlockTimestampUTC.toUTCString(),
      timestamp_UTC: nBlockTimestamp,
      timestamp_block: nBlockTimestampRaw,
      hash_data: oBlock.data.hashData.toString('hex'),
      miner_address: BufferExtended.toBase(InterfaceBlockchainAddressHelper.generateAddressWIF(oBlock.data._minerAddress)),
      trxs_hash_data: oBlock.data.transactions.hashTransactions.toString('hex'),
      trxs_number: oBlock.data.transactions.transactions.length,
      trxs: oOptions.includeTransactions
        ? oBlock.data.transactions.transactions.map((tx, i) => this._oTransactionTransformer.transform(tx, oBlock, i))
        : oBlock.data.transactions.transactions.map((tx) => tx.txId.toString('hex')),
      reward: nBlockReward / WebDollarCoins.WEBD,
      reward_raw: nBlockReward,
      fee_reward: nTransactionsFee / WebDollarCoins.WEBD,
      fee_reward_raw: nTransactionsFee,
      total_reward: (nBlockReward / WebDollarCoins.WEBD) + (nTransactionsFee / WebDollarCoins.WEBD),
      total_reward_raw: nBlockReward + nTransactionsFee,
      createdAtUTC: oBlockTimestampUTC,
      block_raw: BufferExtended.toBase((await oBlock.serializeBlock()).toString('hex')),
      isPOS: bIsPosActivated === true,
      isPOW: bIsPosActivated === false,
      posMinerAddress: null,
      posMinerPublicKey: null,
      posSignature: null
    }

    if (bIsPosActivated) {
      oBlockData.posMinerAddress = oBlockData.miner_address

      if (typeof oBlock.posMinerAddress !== 'undefined') {
        oBlockData.posMinerAddress = BufferExtended.toBase(InterfaceBlockchainAddressHelper.generateAddressWIF(oBlock.posMinerAddress))
      }

      if (typeof oBlock.posSignature !== 'undefined') {
        oBlockData.posSignature = oBlock.posSignature.toString('hex')
      }

      if (typeof oBlock.posMinerPublicKey !== 'undefined') {
        oBlockData.posMinerPublicKey = oBlock.posMinerPublicKey.toString('hex')
      }
    }

    if (oOptions.processHardForks) {
      this._oBlockDataHardForksProcessor.processBlockData(oBlockData, oOptions.includeTransactions)
    }

    return oBlockData
  }
}

export default BlockTransformer
