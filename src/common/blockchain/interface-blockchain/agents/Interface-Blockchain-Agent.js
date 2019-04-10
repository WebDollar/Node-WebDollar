import NodesList from 'node/lists/Nodes-List'
import InterfaceBlockchainProtocol from './../protocol/Interface-Blockchain-Protocol'
import InterfaceBlockchainFork from 'common/blockchain/interface-blockchain/blockchain/forks/Interface-Blockchain-Fork'
import VersionCheckerHelper from 'common/utils/helpers/Version-Checker-Helper'
import CONNECTION_TYPE from 'node/lists/types/Connection-Type'
import Blockchain from 'main-blockchain/Blockchain'
import AGENT_STATUS from './Agent-Status'
import consts from 'consts/const_global'
import InterfaceBlockchainAgentBasic from './Interface-Blockchain-Agent-Basic'
import NODE_TYPE from 'node/lists/types/Node-Type'
import NodesWaitlistConnecting from 'node/lists/waitlist/Nodes-Waitlist-Connecting'
import Log from 'common/utils/logging/Log'

let NodeExpress

if (!process.env.BROWSER) {
  NodeExpress = require('node/sockets/node-server/express/Node-Express').default
}

/**
 *
 * Agent 47   - The place I was raised, they didn't give us names. They gave us numbers. Mine was 47.
 *
 *
 * An Agent is a class that force your machine to synchronize to the network based on the protocol you use it
 */

class InterfaceBlockchainAgent extends InterfaceBlockchainAgentBasic {
  constructor (blockchain) {
    super(blockchain)

    if (VersionCheckerHelper.detectMobileAndTablet()) { this.AGENT_TIME_OUT = 140 * 1000 } else { this.AGENT_TIME_OUT = 120 * 1000 }

    this.AGENT_TIME_INTERVAL = 500

    this._startAgentTimeOut = undefined
    this._startAgentInterval = undefined

    this._newProtocol()
  }

  newFork () {
    let fork = new InterfaceBlockchainFork()
    InterfaceBlockchainFork.prototype.initializeConstructor.apply(fork, arguments)

    return fork
  }

  _newProtocol () {
    this.protocol = new InterfaceBlockchainProtocol(this.blockchain, this)
  }

  _initializeProtocol () {
    this.protocol.initialize(['acceptBlockHeaders'])
  }

  initializeAgentPromise () {
    clearTimeout(this._startAgentTimeOut)
    this._startAgentTimeOut = undefined

    clearInterval(this._startAgentInterval)
    this._startAgentInterval = undefined

    this._setStartAgentInterval()
    this._setStartAgentTimeOut()
  }

  initializeStartAgentOnce () {
    this._initializeProtocol()

    NodesList.emitter.on('nodes-list/connected', async (result) => {

      // AGENT_STATUS.AGENT_STATUS_SYNCHRONIZED_SLAVES will desync from fallback nodes

      // if ( this._determineSynchronizedSlaves() ){
      //
      //     this.status = AGENT_STATUS.AGENT_STATUS_SYNCHRONIZED_SLAVES;
      //     NodesList.disconnectFromFallbacks();
      //
      // }

    })
  }

  _determineSynchronizedSlaves () {
    return !this.light && !NodeExpress.SSL && !NodeExpress.amIFallback() && NodesList.countNodesByType(NODE_TYPE.NODE_TERMINAL) > consts.SETTINGS.PARAMS.CONNECTIONS.TERMINAL.SERVER.TERMINAL_CONNECTIONS_REQUIRED_TO_DISCONNECT_FROM_FALLBACK
  }

  async startAgent (firsTime, synchronizeComplete = false) {
    console.warn('startAgent was started')
    this.status = AGENT_STATUS.AGENT_STATUS_NOT_SYNCHRONIZED

    this.initializeAgentPromise()
    return await this.waitSynchronizationStatus()
  }

  _agentConfirmationIntervalFunction () {
    if (this.blockchain.blocks.length <= 0) return false
    if (NodesList.countNodesByConnectionType(CONNECTION_TYPE.CONNECTION_CLIENT_SOCKET) <= 0) return false

    if (this.light) {
      if (this.blockchain.proofPi !== undefined && this.blockchain.proofPi.blocks.length > 0 && this.blockchain.proofPi.blocks[this.blockchain.proofPi.blocks.length - 1] !== undefined && this.blockchain.blocks.length >= this.blockchain.proofPi.blocks[this.blockchain.proofPi.blocks.length - 1].height + consts.POPOW_PARAMS.k) { this.status = AGENT_STATUS.AGENT_STATUS_SYNCHRONIZED }
    } else { // terminal
      // let's check if we downloaded blocks in the last 2 minutes

      let set = true

      if (this.lastTimeChecked !== undefined) {
        let diffBlocks = this.blockchain.blocks.length - this.lastTimeChecked.blocks
        let shouldItStart = false
        if (NodesList.nodes.length > 0 && diffBlocks >= 0 && diffBlocks < consts.SETTINGS.PARAMS.CONNECTIONS.FORKS.MAXIMUM_BLOCKS_TO_DOWNLOAD &&
                    NodesList.nodes.length >= NodesWaitlistConnecting.connectingMaximum.minimum_fallbacks + NodesWaitlistConnecting.connectingMaximum.minimum_waitlist) {
          shouldItStart = true
        }

        let difference = Math.max(0, Math.floor((1 * 60 * 1000 - (new Date().getTime() - this.lastTimeChecked.date)) / 1000))

        if (Math.random() < 0.1) {
          Log.warn('', Log.LOG_TYPE.BLOCKCHAIN)
          Log.warn(shouldItStart ? ('Synchronization probably starts in: ' + difference + ' seconds ') : 'Synchronizing', Log.LOG_TYPE.BLOCKCHAIN)
          Log.warn('', Log.LOG_TYPE.BLOCKCHAIN)
        }

        if (difference <= 0) {
          if (shouldItStart) { this.status = AGENT_STATUS.AGENT_STATUS_SYNCHRONIZED }
        } else set = false
      }

      if (set) {
        this.lastTimeChecked = {

          date: new Date().getTime(),
          blocks: this.blockchain.blocks.length

        }
      }

      if (NodesList.nodes.length > 0) { this.status = AGENT_STATUS.AGENT_STATUS_SYNCHRONIZED }
    }
  }

  _setStartAgentInterval () {
    if (this._startAgentInterval !== undefined) return

    this._startAgentInterval = setInterval(this._agentConfirmationIntervalFunction.bind(this), this.AGENT_TIME_INTERVAL)
  }

  _setStartAgentTimeOut (factor = 1) {
    if (this._startAgentTimeOut !== undefined) return

    this._startAgentTimeOut = setTimeout(() => {
      this._startAgentTimeOut = undefined

      this.status = AGENT_STATUS.AGENT_STATUS_NOT_SYNCHRONIZED
    }, this.AGENT_TIME_OUT)
  }

  waitSynchronizationStatus () {
    return new Promise((resolve) => {
      this._eventEmitter.once('agent/synchronized', (answer) => {
        resolve(answer)
      })
    })
  }

  set status (newValue) {
    if (this._status === newValue) { return }

    this._status = newValue

    if ([AGENT_STATUS.AGENT_STATUS_SYNCHRONIZED, AGENT_STATUS.AGENT_STATUS_NOT_SYNCHRONIZED, AGENT_STATUS.AGENT_STATUS_SYNCHRONIZED_SLAVES, AGENT_STATUS.AGENT_STATUS_SYNCHRONIZED_POOL].indexOf(newValue) >= 0) {
      clearTimeout(this._startAgentTimeOut)
      this._startAgentTimeOut = undefined

      clearInterval(this._startAgentInterval)
      this._startAgentInterval = undefined
    }

    if ([AGENT_STATUS.AGENT_STATUS_SYNCHRONIZED, AGENT_STATUS.AGENT_STATUS_SYNCHRONIZED_SLAVES, AGENT_STATUS.AGENT_STATUS_SYNCHRONIZED_POOL].indexOf(newValue) >= 0) {
      this._eventEmitter.emit('agent/synchronized', {
        result: true,
        message: 'Start Agent worked successfully'
      })
    } else if (AGENT_STATUS.AGENT_STATUS_NOT_SYNCHRONIZED === newValue) {
      this._eventEmitter.emit('agent/synchronized', {
        result: false,
        message: 'Start Agent Timeout'
      })
    }
  }

  get status () {
    return this._status
  }
}

export default InterfaceBlockchainAgent
