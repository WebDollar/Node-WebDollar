import NodesList from 'node/lists/Nodes-List';
import NODE_TYPE from "node/lists/types/Node-Type";
import NODE_CONSENSUS_TYPE from "node/lists/types/Node-Consensus-Type"
import Blockchain from "main-blockchain/Blockchain";
import BufferExtended from "common/utils/BufferExtended";
import InterfaceBlockchainAddressHelper from "common/blockchain/interface-blockchain/addresses/Interface-Blockchain-Address-Helper";


class NodeAPIPublicPools {


  stats(req, res) {

    let stats = {
      hashes: 0,
      hashes_now: 0,
      miners_online: 0,
      blocks_confirmed_and_paid: 0,
      blocks_unconfirmed: 0,
      blocks_confirmed: 0,
      blocks_being_confirmed: 0,
      time_remaining: 0,
    };

    if (Blockchain.PoolManagement && Blockchain.PoolManagement.poolStarted) {
      var statistics = Blockchain.PoolManagement.poolStatistics;
      stats.hashes = statistics.poolHashes;
      stats.hashes_now = statistics.poolHashesNow;
      stats.miners_online = statistics.poolMinersOnline.length;
      stats.blocks_confirmed_and_paid = statistics.poolBlocksConfirmedAndPaid;
      stats.blocks_unconfirmed = statistics.poolBlocksUnconfirmed;
      stats.blocks_confirmed = statistics.poolBlocksConfirmed;
      stats.blocks_being_confirmed = statistics.poolBlocksBeingConfirmed;
      stats.time_remaining = statistics.poolTimeRemaining;
    }

    return stats;

  }

  minersInstances(req, res) {
    let minerInstances = [];

    if (Blockchain.PoolManagement && Blockchain.PoolManagement.poolStarted) {
      let minersOnline = Blockchain.PoolManagement.poolData.connectedMinerInstances.list;

      for (let i = 0; i < minersOnline.length; i++) {
        var minerInstance = minersOnline[i];

        minerInstances.push({
          hashes: minerInstance.hashesPerSecond,
          hashes_alt: minerInstance.realHashesPerSecond,
          address: minerInstance.addressWIF,
          reward_total: minerInstance.miner._rewardTotal,
          reward_confirmed: minerInstance.miner._rewardConfirmed,
          reward_sent: minerInstance.miner._rewardSent,
          date_activity: minerInstance.dateActivity,
          miner_index: minerInstance.miner.index,
          ip: minerInstance.socket ? minerInstance.socket.node.sckAddress.getAddress(true, true) : "offline",
        });

      }
    }

    return minerInstances;
  }

  minersAll(req, res) {
    let miners = [];

    if (Blockchain.PoolManagement && Blockchain.PoolManagement.poolStarted) {

      let minersAll = Blockchain.PoolManagement.poolData.miners;

      for (let i = 0; i < miners.length; i++) {
        var miner = minersAll[i];

        miners.push({
          address: miner.adressWIF,
          index: miner.index,
          reward_total: miner._rewardTotal,
          reward_confirmed: miner._rewardConfirmed,
          reward_sent: miner._rewardSent,
          date_activity: miner.dateActivity,
          instances: miner.instances.length,
        });

      }
    }

    return miners;
  }

}

export default new NodeAPIPublicPools();
