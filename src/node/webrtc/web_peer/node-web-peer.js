/*
    WEBRTC Node Peer
 */


// TUTORIAL BASED ON
// https://github.com/feross/simple-peer

let wrtc = require('wrtc');
let Peer = require('simple-peer');

import {SocketExtend} from './../../../common/sockets/socket-extend'
import {NodesList} from '../../lists/nodes-list';

class NodeWebPeer {

    /*
        peer = None
        socket = None

        peer.signal can be a promise
    */

    constructor(initiator){

        console.log("Peer Client constructor");

        this.peer = new Peer(
            {
                initiator: initiator,
                trickle: false,
                wrtc: wrtc,
            });

        this.socket =  this.peer;
        this.peer.signalData = null;

        this.peer.on('error', err => { console.log('error', err) } );

        this.peer.on('connect', () => {

            console.log('WEBRTC PEER CONNECTED', this.peer);

            SocketExtend.extendSocket(this.peer, this.peer.remoteAddress,  this.peer.remotePort );

            this.peer.node.protocol.sendHello().then( (answer)=>{
                this.initializePeer();
            });

            // setInterval(function() {
            //     if ((typeof this.peer !== 'undefined')&& ( this.peer !== null)) {
            //         console.log(this.peer);
            //         this.peer.send('whatever' + index + " ___ " + Math.random())
            //     }
            // }, 500);

        });

        this.peer.on('data', (data) => {
            console.log('data: ' + data)
        })

    }

    signalSend(message){

        if (typeof message === 'undefined') message = JSON.parse(message);

        this.peer.signal(message)
    }

    createSignal(inputSignal){

        this.peer.signalData = null;

        console.log("inputSignal ##$$$ ", inputSignal, typeof inputSignal);
        if (typeof inputSignal !== "undefined" ) {
            if (typeof inputSignal === "string") inputSignal = JSON.parse(inputSignal);

            this.peer.signal(inputSignal);
        }

        return new Promise ( (resolve) => {
            this.peer.once('signal', (data) => {


                //console.log('SIGNAL', JSON.stringify(data));

                this.peer.signalData = data;
                resolve(this.peer.signalData)

            });
        });

    }


    initializePeer(){

        //it is not unique... then I have to disconnect
        if (NodesList.registerUniqueSocket(this.peer, "peer") === false){
            return false;
        }

        this.peer.node.protocol.signaling.server.initializeSignalingServerService();

        this.peer.on("disconnect", ()=>{
            console.log("Peer disconnected", socket.node.sckAddress.getAddress());
            NodesList.disconnectSocket(this.peer);
        })

    }
}




exports.NodeWebPeer = NodeWebPeer;