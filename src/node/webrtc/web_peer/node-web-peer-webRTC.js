/*
    WEBRTC Node Peer
 */


// TUTORIAL BASED ON


import {SocketExtend} from './../../../common/sockets/socket-extend'
import {NodesList} from '../../lists/nodes-list';

const config = {

    /*
        SUNT/TURN servers list https://gist.github.com/yetithefoot/7592580
     */

    iceServers: [
        {
            urls: 'stun:stun.l.google.com:19302',
        },
        {urls: "turn:192.155.84.88", "username": "easyRTC", "credential": "easyRTC@pass"},
        {urls: "turn:192.155.84.88?transport=tcp", "username": "easyRTC", "credential": "easyRTC@pass"},
        {urls: "turn:192.155.86.24:443", "credential": "easyRTC@pass", "username": "easyRTC"},
        {urls: "turn:192.155.86.24:443?transport=tcp", "credential": "easyRTC@pass", "username": "easyRTC"},
        {
            urls: "turn:numb.viagenie.ca",
            username: "pasaseh@ether123.net",
            credential: "12345678"
        }

    ]
}

class NodeWebPeerRTC {

    /*
        peer = None
        socket = None

        peer.signal can be a promise
    */

    constructor(){

        console.log("Peer WebRTC Client constructor");

        this.peer = null;
        this.peer.eventSubscribers = []; //to simulate .on and .once
        this.peer.eventSubscribersIndex = 0;

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

        const wrtc = require("wrtc");
        let RTCPeerConnection = wrtc.RTCPeerConnection;
        let RTCSessionDescription = wrtc.RTCSessionDescription;
        let RTCIceCandidate = wrtc.RTCIceCandidate;

        this.peer =  new RTCPeerConnection(config, pcConstraint);

        this.enableEventsHandling();


        console.log('Created webRTC peer');

        this.peer.disconnect = () => { this.peer.destroy() }

        this.socket =  this.peer;
        this.peer.signalData = null;


        if (initiator) {

            this.peer.dataChannel = this.peer.createDataChannel('chat');
            this.setupDataChannel();

            console.log("offer set");
        } else {
            // If user is not the offerer let wait for a data channel
            this.peer.ondatachannel = event => {
                this.peer.dataChannel = event.channel;
                this.setupDataChannel();
            }
        }





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

    }

    createSignalInitiator(callbackSignalingServerSendIceCandidate){

        this.peer.onicecandidate = (event) => {
            if (event.candidate) {
                console.log("onicecandidate",event.candidate);
                callbackSignalingServerSendIceCandidate(event.candidate);
                return event.candidate;
            }
        };

        this.peer.signalData = null;


        let promise = new Promise ( (resolve) => {

            // emitter - signal
            // If user is offerer let them create a negotiation offer and set up the data channel
            this.peer.onnegotiationneeded = () => {

                this.peer.createOffer(

                    (desc)=>{
                        this.peer.setLocalDescription(
                            desc,
                            () => {
                                this.peer.signalData = {"sdp": this.peer.localDescription};
                                resolve(  this.peer.signalData )
                            },
                            (error) => {
                                console.error("errrrro 4", error);
                                resolve(null)
                            }
                        );
                    },
                    (error) => {
                        console.error("errro 5",error);
                        resolve(null);
                    });
            };
        });


        return promise;

    }


    createSignal(inputSignal){

        this.peer.signalData = null;


        let promise = new Promise ( (resolve) => {


            //answer
            if (typeof inputSignal === "string") inputSignal = JSON.parse(inputSignal);


            if (inputSignal.sdp) {
                // This is called after receiving an offer or answer from another peer
                this.peer.setRemoteDescription(new RTCSessionDescription(inputSignal.sdp), () => {

                    console.log('pc.remoteDescription.type', this.peer.remoteDescription.type);

                    // When receiving an offer lets answer it
                    if (this.peer.remoteDescription.type === 'offer') {
                        console.log('Answering offer');

                        this.peer.answer = true;

                        this.peer.createAnswer(
                            (desc)=>{
                                this.peer.setLocalDescription(
                                    desc,
                                    () => {
                                        this.peer.signalData = {'sdp': this.peer.localDescription};
                                        resolve(this.peer.signalData);
                                    },
                                    (error) => {
                                        console.error("errror 7",error);
                                        resolve(null);
                                    }
                                )
                            },
                            (error) => {
                                console.error("errror 6",error);
                                resolve(null);
                            });
                    }
                }, error => console.error(error));
            } else if (inputSignal.candidate) {

                console.log("inputSignal.candidate",inputSignal.candidate);
                // Add the new ICE candidate to our connections remote description
                this.peer.addIceCandidate(new RTCIceCandidate(inputSignal.candidate));
                resolve({result:"iceCandidate successfully introduced"});
            }

        });


        return promise;
    }

    // Hook up data channel event handlers
    setupDataChannel() {
        this.checkDataChannelState();
        this.peer.dataChannel.onopen = this.checkDataChannelState;
        this.peer.dataChannel.onclose = this.checkDataChannelState;
        this.peer.dataChannel.onmessage = (event) => {

            console.log("DATA RECEIVED# ################", JSON.parse(event.data));
        }

    }

    checkDataChannelState() {
        console.log('WebRTC channel state is:', this.peer.dataChannel.readyState);

        if (this.peer.dataChannel.readyState === 'open') {
            console.log('WebRTC data channel is now open');
            this.callEvents("connect", {});
        }

        if (this.peer.dataChannel.readyState === 'close') {
            console.log('WebRTC data channel is now closed');
            this.callEvents("disconnect", {});
        }
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

    /*
        EVENTS HANDLING for
        .on
        .once
        .off

     */

    enableEventsHandling(){
        this.peer.on = (eventName, callback) =>{
            return this.subscribeEvent(eventName, callback, "on");
        };

        this.peer.once = (eventName, callback) =>{
            return this.subscribeEvent(eventName, callback, "once");
        };
        this.peer.off = (index) =>{
            return this.unscribeEvent(index);
        };
    }

    subscribeEvent(eventName, callback, type){

        this.peer.eventSubscribers.push({eventName: eventName, callback: callback, type: type, index: this.peer.eventSubscribersIndex++}) ;

        return this.peer.eventSubscribersIndex;
    }

    unscribeEvent(index){
        for (let i=0; i< this.peer.eventSubscribers.length; i++)
            if (this.peer.eventSubscribers[i].index === index){
                this.peer.eventSubscribers.splice(i, 1);
                return true;
            }

        return false;
    }

    callEvents(eventName, data){

        for (let i=0; i<this.peer.eventSubscribers.length; i++)
            if (this.peer.eventSubscribers[i].eventName === eventName){
                this.peer.eventSubscribers[i].callback(data);
            }

        //deleting once events...
        for (let i=this.peer.eventSubscribers.length-1; i>=0; i--)
            if ((this.peer.eventSubscribers[i].eventName === eventName) && (this.peer.eventSubscribers[i].type === "once"))
                this.peer.eventSubscribers.splice(i,1);

    }

}




exports.NodeWebPeerRTC = NodeWebPeerRTC;