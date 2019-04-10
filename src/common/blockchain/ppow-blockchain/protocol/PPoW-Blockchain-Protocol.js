import InterfaceBlockchainProtocol from 'common/blockchain/interface-blockchain/protocol/Interface-Blockchain-Protocol'
import PPoWBlockchainProtocolForksManager from './PPoW-Blockchain-Protocol-Forks-Manager'
import consts from 'consts/const_global'
import BufferExtended from '../../../utils/BufferExtended'

class PPoWBlockchainProtocol extends InterfaceBlockchainProtocol {
  createForksManager () {
    this.forksManager = new PPoWBlockchainProtocolForksManager(this.blockchain, this)
  }

  _initializeNewSocket (nodesListObject) {
    InterfaceBlockchainProtocol.prototype._initializeNewSocket.call(this, nodesListObject)

    let socket = nodesListObject.socket

    this._initializeNodeNiPoPoW(socket)
  }

  _initializeNodeNiPoPoW (socket) {
    socket.node.on('get/nipopow-blockchain/headers/get-proofs/pi/hash', () => {
      let answer

      if (this.blockchain.agent.light) {
        answer = {
          hash: this.blockchain.proofPi.hash,
          length: this.blockchain.proofPi.blocks.length
        }
      } else // full node
      {
        answer = {
          hash: this.blockchain.prover.proofPi.hash,
          length: this.blockchain.prover.proofPi.blocks.length
        }
      }

      socket.node.sendRequest('get/nipopow-blockchain/headers/get-proofs/pi/hash' + '/answer', answer)
    })

    socket.node.on('get/nipopow-blockchain/headers/get-proofs/pi-gzip', async (data) => {
      if (!data) return

      let serialization
      let proofPi

      if (this.blockchain.agent.light) proofPi = this.blockchain.proofPi
      else proofPi = this.blockchain.prover.proofPi // full node

      if (proofPi.proofGzip) serialization = proofPi.proofGzip
      else serialization = proofPi.proofSerialized

      let moreChunks = false

      if (typeof data.starting === 'number' && typeof data.length === 'number') {
        if (data.length < consts.SETTINGS.PARAMS.MAX_SIZE.MINIMUM_SPLIT_CHUNKS_BUFFER_SOCKETS_SIZE_BYTES) throw { message: 'way to few messages' }

        if ((serialization.length - data.starting) > data.length) { moreChunks = true } else { moreChunks = false }

        if (serialization.length - 1 - data.starting > 0) { serialization = BufferExtended.substr(serialization, data.starting, Math.min(data.length, serialization.length - data.starting)) } else { serialization = new Buffer(0) }

        return socket.node.sendRequest('get/nipopow-blockchain/headers/get-proofs/pi-gzip/answer', {
          result: true,
          data: serialization,
          moreChunks: moreChunks
        })
      }
    })

    socket.node.on('get/nipopow-blockchain/headers/get-proofs/xi', async () => {

      // socket.node.sendRequest("get/nipopow-blockchain/headers/get-proofs/xi"+"/answer", await this.blockchain.prover.proofXi.getProofHeaders() );

    })
  }
}

export default PPoWBlockchainProtocol
