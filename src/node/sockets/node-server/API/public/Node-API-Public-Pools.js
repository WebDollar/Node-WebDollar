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

    if (Blockchain.PoolManagement !== undefined && Blockchain.PoolManagement.poolStarted) {
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

  miners(req, res) {
    let miners = [];

    if (Blockchain.PoolManagement !== undefined && Blockchain.PoolManagement.poolStarted) {
      let minersOnline = Blockchain.PoolManagement.poolData.connectedMinerInstances.list;

      for (let i = 0; i < minersOnline.length; i++) {
        var miner = minersOnline[i];

        var address =  BufferExtended.toBase(InterfaceBlockchainAddressHelper.generateAddressWIF(miner.address));

        miners.push({
          hashes: miner.hashesPerSecond,
          hashes_alt: miner.realHashesPerSecond,
          address: address,
          reward_total: miner.miner._rewardTotal,
          reward_confirmed: miner.miner._rewardConfirmed,
          reward_sent: miner.miner._rewardSent,
          date_activity: miner.dateActivity,
        });
      }
    }

    return miners;
  }

}

export default new NodeAPIPublicPools();
