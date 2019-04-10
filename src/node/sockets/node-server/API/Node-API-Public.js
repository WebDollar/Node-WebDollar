import consts from 'consts/const_global'
import NodesWaitlist from 'node/lists/waitlist/Nodes-Waitlist'
import NODE_TYPE from 'node/lists/types/Node-Type'
import CONNECTIONS_TYPE from 'node/lists/types/Connection-Type'
import NodesList from 'node/lists/Nodes-List'
import Blockchain from 'main-blockchain/Blockchain'
import BlockchainGenesis from 'common/blockchain/global/Blockchain-Genesis'

class NodeAPIPublic {
  constructor () {

  }

  info () {
    if (!Blockchain.blockchain.blocks.last) {
      return {
        message: 'lastBlock is undefined',
        length: Blockchain.blockchain.blocks.length
      }
    }

    let is_synchronized = false
    let currentTimestamp = new Date().getTime()
    let oDate = new Date((Blockchain.blockchain.blocks.last.timeStamp + BlockchainGenesis.timeStampOffset) * 1000)
    let blockTimestamp = oDate.getTime()
    let nSecondsBehind = currentTimestamp - blockTimestamp
    const UNSYNC_THRESHOLD = 600 * 1000 // ~ 15 blocks

    if (nSecondsBehind < UNSYNC_THRESHOLD) {
      is_synchronized = true
    }

    return {

      protocol: consts.SETTINGS.NODE.PROTOCOL,
      version: consts.SETTINGS.NODE.VERSION,

      poolURL: consts.DEBUG ? Blockchain.PoolManagement.poolSettings.poolURL : '',

      blocks: {
        length: Blockchain.blockchain.blocks.length,
        lastBlockHash: Blockchain.blockchain.blocks.last ? Blockchain.blockchain.blocks.last.hash.toString('hex') : ''
      },
      networkHashRate: Blockchain.blockchain.blocks.networkHashRate,
      chainWork: Blockchain.blockchain.blocks.chainWork.toString(),
      sockets: {
        clients: NodesList.countNodesByConnectionType(CONNECTIONS_TYPE.CONNECTION_CLIENT_SOCKET),
        servers: NodesList.countNodesByConnectionType(CONNECTIONS_TYPE.CONNECTION_SERVER_SOCKET),
        webpeers: NodesList.countNodesByConnectionType(CONNECTIONS_TYPE.CONNECTION_WEBRTC)
      },
      services: {
        serverPool: Blockchain.ServerPoolManagement.serverPoolProtocol.loaded,
        miningPool: Blockchain.PoolManagement.poolProtocol.loaded,
        minerPool: Blockchain.MinerPoolManagement.minerPoolProtocol.loaded
      },
      waitlist: {
        list: NodesWaitlist.getJSONList(NODE_TYPE.NODE_TERMINAL, false)
      },
      is_synchronized: is_synchronized,
      secondsBehind: nSecondsBehind / 1000

    }
  }

  helloWorld (req, res) {
    return { hello: 'world' }
  }

  ping (req, res) {
    return { ping: 'pong' }
  }
}

export default new NodeAPIPublic()
