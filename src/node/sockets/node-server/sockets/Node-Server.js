import NODES_CONSENSUS_TYPE from 'node/lists/types/Node-Consensus-Type'
import SocketAddress from 'common/sockets/protocol/extend-socket/Socket-Address'
import Utils from 'common/utils/helpers/Utils'

import consts from 'consts/const_global'
import SocketExtend from 'common/sockets/protocol/extend-socket/Socket-Extend'
import NodesList from 'node/lists/Nodes-List'
import NodeExpress from './../express/Node-Express'
import CONNECTION_TYPE from 'node/lists/types/Connection-Type'
import NODE_TYPE from 'node/lists/types/Node-Type'
import NodePropagationList from 'common/sockets/protocol/Node-Propagation-List'
import Blockchain from 'main-blockchain/Blockchain'
import NodesWaitlist from 'node/lists/waitlist/Nodes-Waitlist'
import AGENT_STATUS from 'common/blockchain/interface-blockchain/agents/Agent-Status'

const io = require('socket.io')

const publicIp = require('public-ip')

const TIME_DISCONNECT_TERMINAL = 5 * 60 * 1000
const TIME_DISCONNECT_TERMINAL_TOO_OLD_BLOCKS = 5 * 60 * 1000

const ROOMS = {

  TERMINALS: {
    TIME_TO_PASS_TO_CONNECT_NEW_CLIENT: 2 * 1000,
    SERVER_FREE_ROOM: 50
  },

  BROWSERS: {
    TIME_TO_PASS_TO_CONNECT_NEW_CLIENT: 2 * 1000,
    SERVER_FREE_ROOM: 50
  }

}

class NodeServer {
  /*
        nodeServer : null,        //Node IO Server Socket
    */

  constructor () {
    console.log('NodeServer constructor')
    this.nodeServer = null

    this.loaded = false

    setInterval(this._disconnectOldSockets.bind(this), 30 * 1000)

    this._rooms = {

      terminals: {
        timeLastConnected: 0,
        serverSits: ROOMS.TERMINALS.SERVER_FREE_ROOM
      },

      browsers: {
        timeLastConnected: 0,
        serverSits: ROOMS.BROWSERS.SERVER_FREE_ROOM
      }

    }
  }

  async startServer () {
    this.nodeServer = null

    let expressOpened = await NodeExpress.startExpress()
    if (!expressOpened) return false

    if (!consts.OPEN_SERVER) return false

    if (this.loaded) return

    try {
      console.warn('Starting Socket.io Server')

      let server = null
      try {
        server = io({
          maxHttpBufferSize: consts.SOCKET_MAX_SIZE_BYRES
        })
      } catch (Exception) {
        console.log('Error Importing io() library', Exception)
      }
      this.nodeServer = server

      console.warn('Starting Socket.io was started successfully')

      server.on('connection', async (socket) => {
        if (!this.loaded) return

        if (socket.request._query['msg'] !== 'HelloNode') {
          if (Math.random() < 0.05) console.error('No Hello Msg')
          return socket.disconnect()
        }

        if (!socket.request._query['version'] || socket.request._query['version'] < consts.SETTINGS.NODE.VERSION_COMPATIBILITY) {
          if (Math.random() < 0.05) console.error('version is invalid', socket.request._query['version'])
          return socket.disconnect()
        }
        if (socket.request._query['uuid'] === consts.SETTINGS.UUID) return false

        let nodeVersion = socket.request._query['version']
        let nodeUUID = socket.request._query['uuid']

        let nodeType = socket.request._query['nodeType']
        if (typeof nodeType === 'string') nodeType = parseInt(nodeType)

        let nodeConsensusType = socket.request._query['nodeConsensusType']
        if (typeof nodeConsensusType === 'string') nodeConsensusType = parseInt(nodeConsensusType)

        let nodeDomain = socket.request._query['domain'] || ''
        nodeDomain = nodeDomain.replace('my-ip', socket.request.connection.remoteAddress)

        let nodeUTC = socket.request._query['UTC']
        if (typeof nodeUTC === 'string') nodeUTC = parseInt(nodeUTC)

        if (!socket.request._query['uuid'] || (nodeType !== NODE_TYPE.NODE_TERMINAL && nodeType !== NODE_TYPE.NODE_WEB_PEER)) {
          console.error('invalid uuid or nodeType')
          return socket.disconnect()
        }

        if ((Blockchain.PoolManagement && Blockchain.PoolManagement._poolStarted && nodeConsensusType !== NODES_CONSENSUS_TYPE.NODE_CONSENSUS_SERVER) ||
                     (Blockchain.ServerPoolManagement && Blockchain.ServerPoolManagement._serverPoolStarted && nodeConsensusType !== NODES_CONSENSUS_TYPE.NODE_CONSENSUS_SERVER)) {
          if (Math.random() < 0.1) { console.error('disconnecting user for being simple node', nodeConsensusType) }

          return socket.disconnect()
        }

        // avoid allowing
        if (!Blockchain.blockchain.agent.consensus) { return socket.disconnect() }

        if (NODE_TYPE.NODE_TERMINAL === nodeType && NodesList.countNodesByType(NODE_TYPE.NODE_TERMINAL) > (Blockchain.isPoolActivated ? consts.SETTINGS.PARAMS.CONNECTIONS.TERMINAL.SERVER.MAXIMUM_CONNECTIONS_FROM_TERMINAL_POOL : consts.SETTINGS.PARAMS.CONNECTIONS.TERMINAL.SERVER.MAXIMUM_CONNECTIONS_FROM_TERMINAL)) {
          // be sure it is not a fallback node
          let waitlist = NodesWaitlist._searchNodesWaitlist(nodeDomain, undefined, NODE_TYPE.NODE_TERMINAL) // it should need a confirmation

          if (!nodeDomain || !waitlist.waitlist || !waitlist.waitlist.isFallback) {
            if (Math.random() < 0.05) console.warn('too many terminal connections')
            return NodePropagationList.propagateWaitlistSimple(socket, nodeType, true) // it will also disconnect the socket
          }
        } else

        if (NODE_TYPE.NODE_WEB_PEER === nodeType && ((NodesList.countNodesByType(NODE_TYPE.NODE_WEB_PEER) > (Blockchain.isPoolActivated ? consts.SETTINGS.PARAMS.CONNECTIONS.TERMINAL.SERVER.MAXIMUM_CONNECTIONS_FROM_BROWSER_POOL : consts.SETTINGS.PARAMS.CONNECTIONS.TERMINAL.SERVER.MAXIMUM_CONNECTIONS_FROM_BROWSER)) || Blockchain.blockchain.agent.status === AGENT_STATUS.AGENT_STATUS_NOT_SYNCHRONIZED) && !consts.DEBUG) {
          if (Math.random() < 0.05) console.warn('too many browser connections')
          return NodePropagationList.propagateWaitlistSimple(socket, nodeType, true) // it will also disconnect the socket
        }

        if (NODE_TYPE.NODE_TERMINAL === nodeType && this._rooms.terminals.serverSits <= 0) {
          if (new Date().getTime() - this._rooms.terminals.timeLastConnected >= ROOMS.TERMINALS.TIME_TO_PASS_TO_CONNECT_NEW_CLIENT) {
            this._rooms.terminals.serverSits = (Blockchain.isPoolActivated ? 10 : 1) * ROOMS.TERMINALS.SERVER_FREE_ROOM
            this._rooms.terminals.timeLastConnected = new Date().getTime()
          } else {
            let waitlist = NodesWaitlist._searchNodesWaitlist(nodeDomain, undefined, NODE_TYPE.NODE_TERMINAL) // it should need a confirmation
            if (!waitlist || !waitlist.waitlist) // it will also disconnect the socket
            { return await NodePropagationList.propagateWaitlistSimple(socket, nodeType, true) }
          }
        } else if (NODE_TYPE.NODE_WEB_PEER === nodeType && this._rooms.browsers.serverSits <= 0) {
          if (new Date().getTime() - this._rooms.browsers.timeLastConnected >= ROOMS.BROWSERS.TIME_TO_PASS_TO_CONNECT_NEW_CLIENT) {
            this._rooms.browsers.serverSits = (Blockchain.isPoolActivated ? 10 : 1) * ROOMS.BROWSERS.SERVER_FREE_ROOM
            this._rooms.browsers.timeLastConnected = new Date().getTime()
          } else return NodePropagationList.propagateWaitlistSimple(socket, nodeType, true)
        } // it will also disconnect the socket

        // check if it is a unique connection, add it to the list
        let sckAddress = new SocketAddress(socket.request.connection.remoteAddress, socket.request.connection.remotePort, socket.request._query['uuid'])

        let connections = NodesList.countNodeSocketByAddress(sckAddress, 'all')

        // in case it is a pool open
        if (connections.countUUIDs === 0 && connections.countIPs < (Blockchain.isPoolActivated ? consts.MINING_POOL.CONNECTIONS.NO_OF_IDENTICAL_IPS : consts.SETTINGS.PARAMS.CONNECTIONS.NO_OF_IDENTICAL_IPS)) {
          SocketExtend.extendSocket(socket, sckAddress, undefined, undefined, 1)

          if (await socket.node.protocol.processHello({
            version: nodeVersion,
            uuid: nodeUUID,
            nodeType: nodeType,
            nodeConsensusType: nodeConsensusType,
            domain: nodeDomain,
            UTC: nodeUTC
          }, { 'uuid': true, 'ip': true, 'port': true }) === false) {
            return socket.disconnect()
          }

          if (Math.random() < 0.3) { console.warn('New connection from ' + socket.node.sckAddress.getAddress(true) + ' ' + (nodeType === NODE_TYPE.NODE_WEB_PEER ? 'browser' : 'terminal')) }

          if (nodeType === NODE_TYPE.NODE_TERMINAL) this._rooms.terminals.serverSits--
          else if (nodeType === NODE_TYPE.NODE_WEB_PEER) this._rooms.browsers.serverSits--

          await socket.node.protocol.justSendHello()

          socket.node.protocol.helloValidated = true

          await this.initializeSocket(socket, { 'uuid': true })
        } else {
          await NodePropagationList.propagateWaitlistSimple(socket, nodeType, true) // it will also disconnect the socket
        }
      })

      try {
        // multiple ports, but doesn't work

        server.listen(NodeExpress.server).on('error', (err) => {
          console.error("Couldn't open server on port ", NodeExpress.port, ' try next port')
          this.loaded = false

          throw err
        })

        this.loaded = true
      } catch (Exception) {
        console.error('Error Calling node_server.listen', Exception)
      }
    } catch (Exception) {
      console.error('Error Starting Node Server ', Exception)
      return false
    }

    console.log('Node Server Started')
    return true
  }

  async initializeSocket (socket, validationDoubleConnectionsTypes) {
    // it is not unique... then I have to disconnect
    if (await NodesList.registerUniqueSocket(socket, CONNECTION_TYPE.CONNECTION_SERVER_SOCKET, socket.node.protocol.nodeType, socket.node.protocol.nodeConsensusType, validationDoubleConnectionsTypes) === false) {
      return false
    }

    socket.once('disconnect', async () => {
      try {
        await NodesList.disconnectSocket(socket)
      } catch (exception) {

      }
    })

    socket.node.protocol.propagation.initializePropagation()
    socket.node.protocol.signaling.server.initializeSignalingServerService()
  }

  async getServerHTTPAddress (getIP) {
    if (!NodeExpress) return ''

    if (!this.loaded) { await NodeExpress.startExpress() }

    if (NodeExpress.port === 0) return ''
    if (NodeExpress.domain === '') return ''

    if (getIP) { return 'http' + (NodeExpress.SSL ? 's' : '') + '://' + await publicIp.v4() + ':' + NodeExpress.port }

    return 'http' + (NodeExpress.SSL ? 's' : '') + '://' + NodeExpress.domain + ':' + NodeExpress.port
  }

  _disconnectOldSockets () {
    let time = new Date().getTime()

    let isPoolActivated = Blockchain.isPoolActivated

    // disconnect unresponsive nodes
    for (let i = 0; i < NodesList.nodes.length; i++) {
      if (NodesList.nodes[i].socket.node && NodesList.nodes[i].socket.node.protocol.nodeType === NODE_TYPE.NODE_TERMINAL) {
        if (isPoolActivated && NodesList.nodes[i].socket.node.protocol.nodeConsensusType === NODES_CONSENSUS_TYPE.NODE_CONSENSUS_MINER_POOL) { continue }

        if (NodesList.nodes[i].date - time > TIME_DISCONNECT_TERMINAL_TOO_OLD_BLOCKS) {
          if (NodesList.nodes[i].socket.node.protocol.blocks === NodesList.nodes[i].socket.node.protocol.blocksPrevious) {
            NodesList.nodes[i].socket.node.protocol.sendLastBlock()

            setTimeout(() => {
              if (NodesList.nodes[i]) { NodesList.nodes[i].socket.disconnect() }
            }, 3000)
          } else {
            NodesList.nodes[i].socket.node.protocol.blocksPrevious = NodesList.nodes[i].socket.node.protocol.blocks
          }
        }
      }
    }

    if (!isPoolActivated) {
      if (NodesList.countNodesByType(NODE_TYPE.NODE_TERMINAL) > consts.SETTINGS.PARAMS.CONNECTIONS.TERMINAL.SERVER.MAXIMUM_CONNECTIONS_FROM_TERMINAL / 2) {
        for (let i = 0; i < NodesList.nodes.length; i++) {
          if (NodesList.nodes[i].socket.node && NodesList.nodes[i].socket.node.protocol.nodeType === NODE_TYPE.NODE_TERMINAL) {
            if (!NodesList.nodes[i].isFallback && NodesList.nodes[i].date - time > TIME_DISCONNECT_TERMINAL) { NodesList.nodes[i].socket.disconnect() }
          }
        }
      }
    }
  }

  close () {
    if (this.nodeServer) { this.nodeServer.close() }
  }
}

export default new NodeServer()
