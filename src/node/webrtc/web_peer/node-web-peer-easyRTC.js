/*
    WEBRTC Node Peer
 */

// TUTORIAL BASED ON
// https://demo.easyrtc.com/demos/demo_data_channel_messaging.html

let Peer = require('easyrtc');

import {SocketExtend} from './../../../common/sockets/socket-extend'
import {NodesList} from '../../lists/nodes-list';

class NodeWebPeerEasyRTC {

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

        let webPeerParams =
            {
                initiator: initiator,
                trickle: false,
                reconnectTimer: 100,
                iceTransportPolicy: 'relay',
                config: {
                    /*
                        SUNT/TURN servers list https://gist.github.com/yetithefoot/7592580
                     */
                    iceServers: [
                        {
                            url: "stun:numb.viagenie.ca",
                            username: "pasaseh@ether123.net",
                            credential: "12345678"
                        },
                        {
                            url: "turn:numb.viagenie.ca",
                            username: "pasaseh@ether123.net",
                            credential: "12345678"
                        }
                    ]
                }
            };

        if (typeof window === 'undefined'){
            for (let i=0; i<5000; i++) console.log("!!!!! Error!!! wrtc assigned")

            const wrtc = require('wrtc');
            webPeerParams.wrtc = wrtc;
        }

        this.peer = new Peer(webPeerParams);

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

        return initiatorSignal;
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
            console.log("Peer disconnected", this.peer.node.sckAddress.getAddress());
            NodesList.disconnectSocket(this.peer);
        })

    }
}




exports.NodeWebPeer = NodeWebPeer;