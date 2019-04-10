import Blockchain from 'main-blockchain/Blockchain'

class NodeAPIPublicPools {
  stats (req, res) {
    let stats = {
      hashes: 0,
      hashes_now: 0,
      miners_online: 0,
      blocks_confirmed_and_paid: 0,
      blocks_unconfirmed: 0,
      blocks_confirmed: 0,
      blocks_being_confirmed: 0,
      time_remaining: 0
    }

    if (Blockchain.PoolManagement && Blockchain.PoolManagement.poolStarted) {
      var statistics = Blockchain.PoolManagement.poolStatistics
      stats.hashes = statistics.poolHashes
      stats.hashes_now = statistics.poolHashesNow
      stats.miners_online = statistics.poolMinersOnline.length
      stats.blocks_confirmed_and_paid = statistics.poolBlocksConfirmedAndPaid
      stats.blocks_unconfirmed = statistics.poolBlocksUnconfirmed
      stats.blocks_confirmed = statistics.poolBlocksConfirmed
      stats.blocks_being_confirmed = statistics.poolBlocksBeingConfirmed
      stats.time_remaining = statistics.poolTimeRemaining
    }

    return stats
  }

  minersInstances (req, res) {
    let minerInstances = []

    if (Blockchain.PoolManagement && Blockchain.PoolManagement.poolStarted) {
      let minersOnline = Blockchain.PoolManagement.poolData.connectedMinerInstances.list

      for (let i = 0; i < minersOnline.length; i++) {
        var minerInstance = minersOnline[i]

        minerInstances.push({
          hashes: minerInstance.hashesPerSecond,
          hashes_alt: minerInstance.realHashesPerSecond,
          address: minerInstance.addressWIF,
          reward_total: minerInstance.miner._rewardTotal,
          reward_confirmed: minerInstance.miner._rewardConfirmed,
          reward_sent: minerInstance.miner._rewardSent,
          date_activity: minerInstance.dateActivity,
          miner_index: minerInstance.miner.index,
          totalPOSBalance: Blockchain.blockchain.accountantTree.getBalance(minerInstance.addressWIF),
          ip: minerInstance.socket ? minerInstance.socket.node.sckAddress.getAddress(true, true) : 'offline'
        })
      }
    }

    return minerInstances
  }

  minersAll (req, res) {
    if (!Blockchain.PoolManagement || !Blockchain.PoolManagement.poolStarted) return []

    let miners = []

    Blockchain.PoolManagement.poolData.miners.forEach((miner) => {
      miners.push({
        address: miner.addressWIF,
        miner_index: miner.index,
        reward_total: miner._rewardTotal,
        reward_confirmed: miner._rewardConfirmed,
        reward_sent: miner._rewardSent,
        date_activity: miner.dateActivity,
        instances: miner.instances.length
      })
    })

    return miners
  }

  poolData (req, res) {
    if (!Blockchain.PoolManagement || !Blockchain.PoolManagement.poolStarted) return []

    let poolData = []

    Blockchain.PoolManagement.poolData.blocksInfo.forEach((blockInfo) => {
      let miningHeights = {}

      for (let key in blockInfo.miningHeights) { miningHeights[key ] = blockInfo.miningHeights[key].toString() }

      let instances = {}
      for (let key in blockInfo.blockInformationMinersInstances) {
        let blockMinerInstance = blockInfo.blockInformationMinersInstances[key]

        let minerInstanceTotalDifficultiesPOW = {}; let minerInstanceTotalDifficultiesPOS = {}

        for (let height in blockMinerInstance._minerInstanceTotalDifficultiesPOW) { minerInstanceTotalDifficultiesPOW[height] = blockInfo.blockInformationMinersInstances[key]._minerInstanceTotalDifficultiesPOW[height].toString() }

        for (let height in blockMinerInstance._minerInstanceTotalDifficultiesPOS) { minerInstanceTotalDifficultiesPOS[height] = blockInfo.blockInformationMinersInstances[key]._minerInstanceTotalDifficultiesPOS[height].toString() }

        instances[key] = {
          address: blockMinerInstance.addressWIF,
          totalDifficultyPOW: blockMinerInstance.minerInstanceTotalDifficultyPOW.toString(),
          totalDifficultyPOS: blockMinerInstance.minerInstanceTotalDifficultyPOS.toString(),
          totalDifficultiesPOW: minerInstanceTotalDifficultiesPOW,
          totalDifficultiesPOS: minerInstanceTotalDifficultiesPOS,
          first: blockInfo.findFirstMinerInstance(blockMinerInstance.address) === blockMinerInstance
        }
      }

      let element = {
        miningHeights: miningHeights,
        instances: instances
      }

      try {
        element.block = blockInfo.block ? blockInfo.block.toJSON() : undefined
      } catch (exception) {

      }

      poolData.push(element)
    })

    return poolData
  }
}

export default new NodeAPIPublicPools()
