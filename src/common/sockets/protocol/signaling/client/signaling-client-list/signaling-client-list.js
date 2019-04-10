import consts from 'consts/const_global'
import SignalingClientPeerObject from './signaling-client-peer-object'
import NodeWebPeerRTC from 'node/webrtc/web-peer/node-web-peer-webRTC'
import NodesList from 'node/lists/Nodes-List'
import NodeSignalingClientService from '../signaling-client-service/Node-Signaling-Client-Service'
/*
    The List is populated with Node Sockets who are available for WebRTC
 */

class SignalingClientList {
  // list = []            - storing the connected sockets

  constructor () {
    console.log('SignalingRoomList constructor')

    this.connected = []
  }

  desinitializeWebPeerConnection (webpeer) {
    let pos = this.findWebPeerSignalingClientList(undefined, undefined, webpeer.peer.node.sckAddress.uuid)

    if (pos !== -1) {
      this.connected.splice(pos, 1)

      NodeSignalingClientService.askRandomSignalingServerToConnect()
    }
  }

  registerWebPeerSignalingClientListBySignal (signalInitiator, signalAnswer, uuid, signalingClientType) {
    let signalingClientPeerObject = this.searchWebPeerSignalingClientList(signalInitiator, signalAnswer, uuid)

    if (signalingClientPeerObject === null) {
      let webPeer = new NodeWebPeerRTC()
      signalingClientPeerObject = new SignalingClientPeerObject(webPeer, uuid, signalingClientType)

      this.connected.push(signalingClientPeerObject)
    }

    return signalingClientPeerObject
  }

  findWebPeerSignalingClientList (signalInitiator, signalAnswer, uuid) {
    // previous established connection
    for (let i = 0; i < this.connected.length; i++) {
      if (this.connected[i].webPeer.peer !== null && this.connected[i].webPeer.peer !== undefined) {
        if (signalInitiator !== undefined && JSON.stringify(this.connected[i].webPeer.peer.signalInitiatorData) === JSON.stringify(signalInitiator)) { return i }

        if (signalAnswer !== undefined && JSON.stringify(this.connected[i].webPeer.peer.signalData) === JSON.stringify(signalAnswer)) { return i }

        if (uuid !== undefined && this.connected[i].uuid === uuid) { return i }
      }
    }

    return -1
  }

  searchWebPeerSignalingClientList (signalInitiator, signalAnswer, uuid) {
    let pos = this.findWebPeerSignalingClientList(signalInitiator, signalAnswer, uuid)

    if (pos === -1) return null

    return this.connected[pos]
  }

  deleteWebPeerSignalingClientList (uuid) {
    for (let i = 0; i < this.connected.length; i++) {
      if (this.connected[i].uuid === uuid) {
        this.connected[i].webPeer.peer.close()
        this.connected.splice(i, 1)
        return true
      }
    }

    return false
  }

  computeMaxWebPeersConnected (uuid) {
    return consts.SETTINGS.PARAMS.CONNECTIONS.BROWSER.WEBRTC.MAXIMUM_CONNECTIONS + (this.findWebPeerSignalingClientList(undefined, undefined, uuid) !== -1 ? 1 : 0)
  }

  countConnectedByType (signalingClientType) {
    let count = 0
    for (let i = 0; i < this.connected.length; i++) {
      if (this.connected[i].signalingClientType === signalingClientType) { count++ }
    }

    return count
  }
}

export default new SignalingClientList()
