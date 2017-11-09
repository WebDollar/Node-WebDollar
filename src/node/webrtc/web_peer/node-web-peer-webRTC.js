/*
    WEBRTC Node Peer
 */


// TUTORIAL BASED ON
// https://github.com/feross/simple-peer

var wrtc = require("wrtc");
RTCPeerConnection = wrtc.RTCPeerConnection;
RTCSessionDescription = wrtc.RTCSessionDescription;
RTCIceCandidate = wrtc.RTCIceCandidate;


import {SocketExtend} from './../../../common/sockets/socket-extend'
import {NodesList} from '../../lists/nodes-list';

const config = {

    /*
        SUNT/TURN servers list https://gist.github.com/yetithefoot/7592580
     */

    iceServers: [
        {
            urls: "stun:numb.viagenie.ca",
            username: "pasaseh@ether123.net",
            credential: "12345678"
        },
        {
            urls: "turn:numb.viagenie.ca",
            username: "pasaseh@ether123.net",
            credential: "12345678"
        }

    ]
}

class NodeWebPeer {

    /*
        peer = None
        socket = None

        peer.signal can be a promise
    */

    constructor(){

        console.log("Peer WebRTC Client constructor");

        this.peer = null;

    }

    createPeer(initiator){

        let pcConstraint = null;
        let dataConstraint = null;
        console.log('Using SCTP based data channels');

        // SCTP is supported from Chrome 31 and is supported in FF.
        // No need to pass DTLS constraint as it is on by default in Chrome 31.
        // For SCTP, reliable and ordered is true by default.
        // Add localConnection to global scope to make it visible
        // from the browser console.


        this.peer =  new RTCPeerConnection(config, pcConstraint);

        //localConnection.setConfiguration(servers);

        console.log('Created local peer connection object localConnection');

        this.peer.sendChannel = this.peer.createDataChannel('sendDataChannel', dataConstraint);

        console.log('Created send data channel');

        this.peer.onicecandidate = function(e) {
            onIceCandidate(this.peer, e);
        };
        this.peer.sendChannel.onopen = onSendChannelStateChange;
        this.peer.sendChannel.onclose = onSendChannelStateChange;

        if (typeof window === 'undefined'){
            for (let i=0; i<5000; i++) console.log("!!!!! Error!!! wrtc assigned")
        }

        this.peer.disconnect = () => { this.peer.destroy() }

        this.socket =  this.peer;
        this.peer.signalData = null;

        let initiatorSignal = null;

        if (initiator)
            initiatorSignal = this.createSignal(undefined);

        // this.peer.on('error', err => { console.log('error', err) } );
        //
        // this.peer.on('connect', () => {
        //
        //     console.log('WEBRTC PEER CONNECTED', this.peer);
        //
        //     SocketExtend.extendSocket(this.peer, this.peer.remoteAddress,  this.peer.remotePort );
        //
        //     this.peer.node.protocol.sendHello().then( (answer)=>{
        //         this.initializePeer();
        //     });
        //
        // });
        //
        // this.peer.on('data', (data) => {
        //     console.log('data: ' , data)
        // });

        return initiatorSignal;
    }


    createSignal(inputSignal){

        this.peer.signalData = null;



        let promise = new Promise ( (resolve) => {


            this.peer.createOffer()

                .then( (data)=>{
                    this.peer.signalData = data;
                    this.peer.setLocalDescription(data);
                    resolve(this.peer.signalData)
                })

                .catch((error)=>{
                    resolve(null);
                    console.log('Failed to create session description: ' + error.toString());
                });


        });

        if (typeof inputSignal !== "undefined" ) {
            if (typeof inputSignal === "string") inputSignal = JSON.parse(inputSignal);

            //console.log("inputSignal ##$$#$$$$$$ ", inputSignal, typeof inputSignal);
            this.peer.signal(inputSignal);
        }


        return promise;

    }


    initializePeer(){

        //it is not unique... then I have to disconnect
        if (NodesList.registerUniqueSocket(this.peer, "webpeer") === false){
            return false;
        }

        this.peer.node.protocol.signaling.server.initializeSignalingServerService();

        this.peer.on("close", ()=>{
            console.log("Peer disconnected", this.peer.node.sckAddress.getAddress());
            NodesList.disconnectSocket(this.peer);
        })

    }
}




exports.NodeWebPeer = NodeWebPeer;