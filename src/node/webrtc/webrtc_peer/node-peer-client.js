/*
    WEBRTC Node Peer
 */


// TUTORIAL BASED ON
// https://github.com/feross/simple-peer

let wrtc = require('wrtc');
let Peer = require('simple-peer');

class NodePeerClient {

    /*
        this.webrtc_peer = None
    */

    constructor(initiator){

        console.log("Peer Client constructor");

        let peer = new Peer(
            {
                initiator: initiator,
                trickle: false,
                wrtc: wrtc,
            });

        this.peer = peer;

        this.initializePeer();

    }

    initializePeer(){
        this.peer.on('error', err => { console.log('error', err) } );

        this.peer.on('signal', data => {
            console.log('SIGNAL', JSON.stringify(data));
        });

        this.peer.on('connect', () => {
            console.log('CONNECT');

            setInterval(function() {
                if ((typeof this.peer !== 'undefined')&& ( this.peer !== null)) {
                    console.log(this.peer);
                    this.peer.send('whatever' + index + " ___ " + Math.random())
                }
            }, 500);

        });

        this.peer.on('data', (data) => {
            console.log('data: ' + data)
        })
    }

    signalSend(message){

        if (typeof message === 'undefined') message = JSON.parse(message);

        this.peer.signal(message)
    }





}

exports.NodePeerClient = NodePeerClient;