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

    constructor(){

        console.log("Peer Client constructor");

        this.peer = null;

    }

    createPeer(initiator){

        this.peer = new Peer(
            {
                initiator: initiator,
                trickle: false,
                wrtc: wrtc,
            });

        this.peer.disconnect = () => { this.peer.destroy() }

        this.socket =  this.peer;
        this.peer.signalData = null;

        let initiatorSignal = null;
        if (initiator)
            initiatorSignal = this.createSignal(undefined);

        this.peer.on('error', err => { console.log('error', err) } );

        this.peer.on('connect', () => {

            console.log('WEBRTC PEER CONNECTED', this.peer);

            SocketExtend.extendSocket(this.peer, this.peer.remoteAddress,  this.peer.remotePort );

            this.peer.node.protocol.sendHello().then( (answer)=>{
                this.initializePeer();
            });

        });

        this.peer.on('data', (data) => {
            console.log('data: ' , data)
        });

        // this.peer.on('signal', function (data) {
        //     console.log('SIGNAL_NEW', JSON.stringify(data));
        // });

        return initiatorSignal;
    }

    signalSend(message){

        if (typeof message === 'undefined') message = JSON.parse(message);

        this.peer.signal(message)
    }

    createSignal(inputSignal){

        this.peer.signalData = null;

        let promise = new Promise ( (resolve) => {
            this.peer.once('signal', (data) => {

                //console.log('SIGNAL###', JSON.stringify(data));

                this.peer.signalData = data;
                resolve(this.peer.signalData)

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
            console.log("Peer disconnected", socket.node.sckAddress.getAddress());
            NodesList.disconnectSocket(this.peer);
        })

    }
}




exports.NodeWebPeer = NodeWebPeer;