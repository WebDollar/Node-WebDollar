import NodesList from 'node/lists/Nodes-List'
import InterfaceBlockchainProtocolForkSolver from './Interface-Blockchain-Protocol-Fork-Solver'
import InterfaceBlockchainProtocolForksManager from './Interface-Blockchain-Protocol-Forks-Manager'

import Serialization from 'common/utils/Serialization'
import NodeProtocol from 'common/sockets/protocol/extend-socket/Node-Protocol'
import BufferExtended from 'common/utils/BufferExtended'
import NodeBlockchainPropagation from '../../../sockets/protocol/propagation/Node-Blockchain-Propagation'

/**
 * Blockchain Protocol
 */
class InterfaceBlockchainProtocol {
  constructor (blockchain) {
    this.blockchain = blockchain

    this.acceptBlockHeaders = true
    this.acceptBlocks = true

    this.forkSolver = undefined
    this.tipsManager = undefined
  }

  setBlockchain (blockchain) {
    this.blockchain = blockchain

    if (this.forkSolver) { this.forkSolver.blockchain = blockchain }

    if (this.tipsManager) { this.tipsManager.blockchain = blockchain }
  }

  initialize (params) {
    this.acceptBlockHeaders = params.indexOf('acceptBlockHeaders') >= 0
    this.acceptBlocks = params.indexOf('acceptBlocks') >= 0

    NodesList.emitter.on('nodes-list/connected', (result) => {
      this._initializeNewSocket(result)
    })

    NodesList.emitter.on('nodes-list/disconnected', (result) => {
      this._uninitializeSocket(result)
    })

    // already connected sockets
    for (let i = 0; i < NodesList.nodes.length; i++) { this._initializeNewSocket(NodesList.nodes[i]) }

    this.createForkSolver()
    this.createForksManager()
  }

  createForkSolver () {
    this.forkSolver = new InterfaceBlockchainProtocolForkSolver(this.blockchain, this)
  }

  createForksManager () {
    this.forksManager = new InterfaceBlockchainProtocolForksManager(this.blockchain, this)
  }

  _validateBlockchainHeader (data) {
    if (data === undefined || data === null) throw { message: 'data is not defined' }

    // validating data
    if (typeof data.chainLength !== 'number') throw { message: 'chainLength is not specified' }
    if (typeof data.chainStartingPoint !== 'number') throw { message: 'chainStartingPoint is not specified' }

    if (typeof data.height !== 'number') throw { message: 'height is not specified' }
    if (typeof data.header !== 'object') throw { message: 'header is not specified' }
    if (!data.header) throw { message: 'header.header is not specified' }
    if (!data.header.hashPrev) throw { message: 'header.hashPrev is not specified' }
    if (!data.header.hash) throw { message: 'header.hash is not specified' }

    if (typeof data.header.hashPrev === 'string') { data.header.hashPrev = Serialization.fromBase(data.header.hashPrev) }

    if (typeof data.header.hash === 'string') { data.header.hash = Serialization.fromBase(data.header.hash) }

    if ((typeof data.header.nonce === 'number' || Buffer.isBuffer(data.header.nonce)) === false) { throw { message: 'nonce is not specified' } }

    if (typeof data.header.data.hashData === 'string') { data.header.data.hashData = Serialization.fromBase(data.header.data.hashData) }

    if (data.header.chainLength < data.header.height) { throw { message: 'chainLength is smaller than block height ?? ', dataChainLength: data.header.chainLength, dataHeaderHeight: data.header.height } }

    if (data.header.chainStartingPoint > data.header.height) { throw { message: 'chainLength is smaller than block height ?? ', dataChainStartingPoint: data.header.chainStartingPoint, dataHeaderHeight: data.header.height } }
  }

  _initializeNewSocket (nodesListObject) {
    let socket = nodesListObject.socket

    // sending the last block using the protocol
    if (this.acceptBlockHeaders) {
      try {
        if (this.blockchain.blocks.length > 0 && this.blockchain.blocks.last) {
          socket.node.sendRequest('head/last-block/a', {
            l: this.blockchain.blocks.length,
            h: this.blockchain.blocks.last.hash,
            s: this.blockchain.blocks.blocksStartingPoint,
            p: this.blockchain.agent.light ? (this.blockchain.proofPi && this.blockchain.proofPi.validatesLastBlock()) : true,
            W: this.blockchain.blocks.chainWorkSerialized
          })
        }
      } catch (exception) {

      }
    }

    if (this.acceptBlockHeaders) {
      socket.node.on('head/new-block', async (data) => {
      /*
                    h hash
                    l chainLength
                    s chainStartingPoint
                    p hasProof (boolean)
                    W WorkChain

                 */

        if (!data || (data.l < 0) || (data.s >= data.l)) return

        if (Math.random() < 0.1) { console.log('newForkTip', data.l) }

        await this.blockchain.sleep(15 + Math.random() * 20)

        this.forksManager.newForkTip(socket, data.l, data.s, data.h, data.p, data.W)
      })
    }

    if (this.acceptBlockHeaders) {
      socket.node.on('head/chainHash', async (h) => {
        // height
        if (typeof h !== 'number' || this.blockchain.blocks.length <= h) { return socket.node.sendRequest('head/chainHash', null) }

        let chainHash = await this.blockchain.getChainHash(h)
        socket.node.sendRequest('head/chainHash/' + h, { hash: chainHash })
      })

      socket.node.on('head/hash', async (h) => {
        // height

        if (typeof h !== 'number' || this.blockchain.blocks.length <= h) { return socket.node.sendRequest('head/hash', null) }

        let hash = await this.blockchain.getHash(h)

        socket.node.sendRequest('head/hash/' + h, { hash: hash })
      })
    }

    if (this.acceptBlocks) {
      socket.node.on('blockchain/blocks/request-block-by-height', async (data) => {
      // data.height
      // data.onlyHeader

        if (typeof data.height !== 'number') throw { message: 'data.height is not defined' }
        if (this.blockchain.blocks.length <= data.height) { throw { message: 'data.height is higher than I have ', blockchainLength: this.blockchain.blocks.length, clientHeight: data.height } }

        let serialization = await (data.onlyHeader ? this.blockchain.blocks.loadingManager.getBlockHeaderBuffer(data.height) : this.blockchain.blocks.loadingManager.getBlockBuffer(data.height))
        if (!serialization) throw { message: 'block is empty', height: data.height }

        socket.node.sendRequest('blockchain/blocks/request-block-by-height/' + (data.height || 0), {
          result: true,
          block: serialization
        })
      })
    }

    if (this.blockchain.agent.consensus) { this.askBlockchain(socket) }
  }

  _uninitializeSocket (nodesListObject) {
    let socket = nodesListObject.socket
  }

  async askBlockchain (socket) {
    try {
      let data = await socket.node.sendRequestWaitOnce('head/last-block', undefined, 'a')

      if (!data) return false

      return await this.forksManager.newForkTip(socket, data.l, data.s, data.h, data.p, data.W)
    } catch (exception) {
      console.error('Error asking for Blockchain', exception)
      return false
    }
  }
}

export default InterfaceBlockchainProtocol
