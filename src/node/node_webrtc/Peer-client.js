// TUTORIAL BASED ON
// https://github.com/feross/simple-peer

let wrtc = require('wrtc');
let Peer = require('simple-peer');

class PeerClient {

    /*
        nodeDiscoveryService = null     //Node Discovery Service
        this.nodeClients = []
    */

    constructor(initiator){
        console.log("NodeServiceClients constructor");

        let peer = new Peer(
            {
                initiator: initiator,
                trickle: false,
                wrtc: wrtc,
            });

        this.peer = peer;



        this.peer.on('error', function (err) { console.log('error', err) });

        this.peer.on('signal', function (data) {
            console.log('SIGNAL', JSON.stringify(data));
        });

        this.peer.on('connect', function () {
            console.log('CONNECT');

            setInterval(function() {
                if ((typeof peer !== 'undefined')&& ( peer !== null)) {
                    console.log(peer);
                    peer.send('whatever' + index + " ___ " + Math.random())
                }
            }, 500);

        });

        this.peer.on('data', function (data) {
            console.log('data: ' + data)
        })

    }

    signalSend(){
        p.signal(JSON.parse(document.querySelector('#incoming').value))
    }





}

exports.PeerClient = PeerClient;