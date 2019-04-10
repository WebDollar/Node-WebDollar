import PPoWBlockchainAgentFullNode from 'common/blockchain/ppow-blockchain/agents/PPoW-Blockchain-Agent-Full-Node'
import InterfaceBlockchainAgentFullNode from 'common/blockchain/interface-blockchain/agents/Interface-Blockchain-Agent-Full-Node'
import MiniBlockchainLightProtocol from 'common/blockchain/mini-blockchain/protocol/light/Mini-Blockchain-Light-Protocol'
import MiniBlockchainForkLight from '../protocol/light/Mini-Blockchain-Light-Fork'
import consts from 'consts/const_global'
import NodesList from 'node/lists/Nodes-List'
import CONNECTION_TYPE from 'node/lists/types/Connection-Type'
import Blockchain from 'main-blockchain/Blockchain'
import AGENT_STATUS from 'common/blockchain/interface-blockchain/agents/Agent-Status'

let inheritAgentClass

if (consts.POPOW_PARAMS.ACTIVATED) inheritAgentClass = PPoWBlockchainAgentFullNode
else inheritAgentClass = InterfaceBlockchainAgentFullNode

const WEBRTC_MINIMUM_LIGHT = 6
const WEBRTC_MINIMUM_LIGHT_PROBABILITY = 1 / WEBRTC_MINIMUM_LIGHT

class MiniBlockchainAgentLightNode extends inheritAgentClass {
  constructor (blockchain) {
    super(blockchain)

    this.light = true
  }

  newFork () {
    let fork = new MiniBlockchainForkLight()
    MiniBlockchainForkLight.prototype.initializeConstructor.apply(fork, arguments)

    return fork
  }

  _newProtocol () {
    this.protocol = new MiniBlockchainLightProtocol(this.blockchain, this)
  }

  initializeStartAgentOnce () {
    this._initializeProtocol()
    //
    // NodesList.emitter.on("nodes-list/disconnected", async (result) => {
    //
    //
    //
    //     if ( NodesList.countNodesByConnectionType(CONNECTION_TYPE.CONNECTION_WEBRTC) < 3)
    //         Blockchain.synchronizeBlockchain(); //let's synchronize again
    //
    // });
    //
    // NodesList.emitter.on("nodes-list/connected", async (result) => {
    //
    //     let webrtc = NodesList.countNodesByConnectionType(CONNECTION_TYPE.CONNECTION_WEBRTC);
    //
    //     if ( webrtc > WEBRTC_MINIMUM_LIGHT) {
    //         //let's disconnect from full nodes
    //
    //         if ( this.status !== AGENT_STATUS.AGENT_STATUS_SYNCHRONIZED_SLAVES ) {
    //
    //             this.status = AGENT_STATUS.AGENT_STATUS_SYNCHRONIZED_SLAVES;
    //
    //             if (Math.random() > WEBRTC_MINIMUM_LIGHT_PROBABILITY + 0.15) // most will disconnect from full nodes
    //                 NodesList.disconnectAllNodes(CONNECTION_TYPE.CONNECTION_CLIENT_SOCKET);
    //
    //         }
    //
    //     }
    //
    //     if ( webrtc > WEBRTC_MINIMUM_LIGHT + 2) {
    //
    //         if (Math.random() <= 0.1)
    //             NodesList.disconnectAllNodes(CONNECTION_TYPE.CONNECTION_CLIENT_SOCKET);
    //
    //     }
    //
    // });
  }

  _initializeConsensus (newConsensus) {
    inheritAgentClass.prototype._initializeConsensus.call(this, newConsensus)

    if (newConsensus) {
      this._intervalWebRTC = setInterval(() => {
        if (this.blockchain.proofPi) {
          if (new Date().getTime() - this.blockchain.proofPi.date.getTime() >= consts.BLOCKCHAIN.DIFFICULTY.TIME_PER_BLOCK * 1000 * 2) {
            if (Math.random() < 2 * WEBRTC_MINIMUM_LIGHT_PROBABILITY && this.status === AGENT_STATUS.AGENT_STATUS_SYNCHRONIZED_SLAVES) {
              console.warn('mini blockchain agent light synchronization')
              Blockchain.synchronizeBlockchain() // let's synchronize again
            }
          }
        }
      }, (consts.BLOCKCHAIN.DIFFICULTY.TIME_PER_BLOCK - 10) * 1000)

      this._lastBlocks = undefined
      this._intervalBlocksSame = setInterval(() => {
        if (this.blockchain.blocks.length <= 10) return

        if (this._lastBlocks !== undefined) {
          if (this._lastBlocks === this.blockchain.blocks.length) { location.reload() }
        }

        this._lastBlocks = this.blockchain.blocks.length
      }, consts.BLOCKCHAIN.DIFFICULTY.TIME_PER_BLOCK * 10 * 1000)
    } else {
      clearInterval(this._intervalWebRTC)
      clearInterval(this._intervalBlocksSame)
    }
  }
}

export default MiniBlockchainAgentLightNode
