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

        if (initiator) {
            this.createSignal(undefined);
        } else {
            this.signal = null;
        }

        this.peer.on('error', err => { console.log('error', err) } );

        this.peer.on('connect', () => {

            console.log('CONNECT');

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

        if (typeof inputSignal !== "undefined" ) this.signal(inputSignal);

        this.signal = new Promise ( (resolve) => {
            this.peer.on('signal', data => {

                //this.peer.signal = data;
                console.log('SIGNAL', JSON.stringify(data));

                resolve(data)

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