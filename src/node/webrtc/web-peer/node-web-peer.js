/*
    WEBRTC Node Peer
 */


// TUTORIAL BASED ON
// https://github.com/feross/simple-peer

//
// let Peer = require('simple-peer');
//
// import SocketExtend from 'common/sockets/socket-extend'
// import NodesList from 'node/lists/nodes-list'
//
// class NodeWebPeer {
//
//     /*
//         peer = None
//         socket = None
//
//         peer.signal can be a promise
//     */
//
//     constructor(){
//
//         console.log("Peer Client constructor");
//
//         this.peer = null;
//
//     }
//
//     createPeer(initiator){
//
//         let webPeerParams =
//             {
//                 initiator: initiator,
//                 trickle: false,
//                 reconnectTimer: 100,
//                 iceTransportPolicy: 'relay',
//                 config: {
//
//                     /*
//                         SUNT/TURN servers list https://gist.github.com/yetithefoot/7592580
//                      */
//
//                     iceServers: [
//                             {
//                                 urls: "stun:numb.viagenie.ca",
//                                 username: "pasaseh@ether123.net",
//                                 credential: "12345678"
//                             },
//                             {urls: "turn:192.155.84.88", "username": "easyRTC", "credential": "easyRTC@pass"},
//                             {urls: "turn:192.155.84.88?transport=tcp", "username": "easyRTC", "credential": "easyRTC@pass"},
//                             {urls: "turn:192.155.86.24:443", "credential": "easyRTC@pass", "username": "easyRTC"},
//                             {urls: "turn:192.155.86.24:443?transport=tcp", "credential": "easyRTC@pass", "username": "easyRTC"},
//
//                             // {url:'stun:stun.l.google.com:19302'},
//                             // {url:'stun:stun1.l.google.com:19302'},
//                             // {url:'stun:stun2.l.google.com:19302'},
//                             // {url:'stun:stun3.l.google.com:19302'},
//                             // {url:'stun:stun4.l.google.com:19302'},
//                             // { urls: 'stun:stun.stunprotocol.org' },
//                             //     { urls: [
//                             //         'stun:stun.gmx.de',
//                             //         'stun:stun.gmx.net'
//                             //     ]
//                             // }
//
//                             // {url:'stun:stun01.sipphone.com'},
//                             // {url:'stun:stun.ekiga.net'},
//                             // {url:'stun:stun.fwdnet.net'},
//                             // {url:'stun:stun.ideasip.com'},
//                             // {url:'stun:stun.iptel.org'},
//                             // {url:'stun:stun.rixtelecom.se'},
//                             // {url:'stun:stun.schlund.de'},
//                     ]
//                 }
//             };
//
//         if ( window === undefined){
//             for (let i=0; i<500; i++) console.log("!!!!! Error!!! wrtc assigned")
//
//             const wrtc = require('wrtc');
//             webPeerParams.wrtc = wrtc;
//         }
//
//         this.peer = new Peer(webPeerParams);
//
//         this.peer.disconnect = () => { this.peer.destroy() }
//
//         this.socket =  this.peer;
//         this.peer.signalData = null;
//
//         let initiatorSignal = null;
//         if (initiator)
//             initiatorSignal = this.createSignal(undefined);
//
//         this.peer.on('error', err => { console.log('error', err) } );
//
//         this.peer.on('connect', () => {
//
//             console.log('WEBRTC PEER CONNECTED', this.peer);
//
//             SocketExtend.extendSocket(this.peer, this.peer.remoteAddress,  this.peer.remotePort );
//
//             this.peer.node.protocol.sendHello(["uuid"]).then( (answer)=>{
//                 this.initializePeer(["uuid"]);
//             });
//
//         });
//
//         this.peer.on('data', (data) => {
//             console.log('data: ' , data)
//         });
//
//         return initiatorSignal;
//     }
//
//
//     createSignal(inputSignal){
//
//         this.peer.signalData = null;
//
//         let promise = new Promise ( (resolve) => {
//             this.peer.once('signal', (data) => {
//
//                 //console.log('SIGNAL###', JSON.stringify(data));
//
//                 this.peer.signalData = data;
//                 resolve(this.peer.signalData)
//
//             });
//         });
//
//         if (inputSignal !== undefined ) {
//             if (typeof inputSignal === "string") inputSignal = JSON.parse(inputSignal);
//
//             //console.log("inputSignal ##$$#$$$$$$ ", inputSignal, typeof inputSignal);
//             this.peer.signal(inputSignal);
//         }
//
//
//         return promise;
//
//     }
//
//
//     initializePeer(validationDoubleConnectionsTypes){
//
//         //it is not unique... then I have to disconnect
//         if (NodesList.registerUniqueSocket(this.peer, "webpeer", validationDoubleConnectionsTypes) === false){
//             return false;
//         }
//
//         this.peer.node.protocol.signaling.server.initializeSignalingServerService();
//
//         this.peer.on("close", ()=>{
//             console.log("Peer disconnected", this.peer.node.sckAddress.getAddress());
//             NodesList.disconnectSocket(this.peer);
//         })
//
//     }
// }
//
//
//
//
// export default NodeWebPeer;