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


        this.peer.signalInitiatorData = null;

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


        this.peer.on('error', err => { console.log('error', err) } );

        this.peer.on('connect', () => {

            console.log('WEBRTC PEER CONNECTED', this.peer);

            let remote = this.processDescription(this.peer.remoteDescription);

            this.peer.remoteAddress = remote.address;
            this.peer.remotePort = remote.port;

            SocketExtend.extendSocket(this.peer, this.peer.remoteAddress,  this.peer.remotePort );

            this.peer.node.protocol.sendHello().then( (answer)=>{
                this.initializePeer();
            });

        });

        this.peer.on('data', (data) => {
            console.log('data: ' , data)
        });


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
                                this.peer.signalInitiatorData = this.peer.signalData;

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

                        this.peer.signalInitiatorData = inputSignal;

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

                // Add the new ICE candidate to our connections remote description
                try {
                    console.log("inputSignal.candidate", inputSignal.candidate);
                    this.peer.addIceCandidate(new RTCIceCandidate(inputSignal.candidate));
                    resolve({result: "iceCandidate successfully introduced"});
                } catch (Exception){
                    console.log("iceCandidate error", inputSignal.candidate);
                }
            }

        });


        return promise;
    }

    // Hook up data channel event handlers
    setupDataChannel() {
        this.checkDataChannelState();
        this.peer.dataChannel.onopen = ()=>{this.checkDataChannelState()};
        this.peer.dataChannel.onclose = ()=>{this.checkDataChannelState()};

        this.peer.dataChannel.onmessage = (event) => {

            let data = JSON.parse(event.data);

            let name = data.name;
            let value = data.value;
            if (name !== '')
                this.callEvents(name, value);

            console.log("DATA RECEIVED# ################", data);
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

        this.peer.eventSubscribers = []; //to simulate .on and .once
        this.peer.eventSubscribersIndex = 0;

        this.peer.on = (eventName, callback) =>{
            return this.subscribeEvent(eventName, callback, "on");
        };

        this.peer.once = (eventName, callback) =>{
            return this.subscribeEvent(eventName, callback, "once");
        };
        this.peer.off = (index) =>{
            return this.unscribeEvent(index);
        };
        this.peer.send = (name, value) =>{

            let data = {name: name, value: value};

            this.peer.dataChannel.send(JSON.stringify(data));
        };
    }

    subscribeEvent(eventName, callback, type){
        if (!this.peer ) return  null;

        this.peer.eventSubscribers.push({eventName: eventName, callback: callback, type: type, index: this.peer.eventSubscribersIndex++}) ;

        return this.peer.eventSubscribersIndex;
    }

    unscribeEvent(index){
        if (!this.peer ) return  null;

        for (let i=0; i< this.peer.eventSubscribers.length; i++)
            if (this.peer.eventSubscribers[i].index === index){
                this.peer.eventSubscribers.splice(i, 1);
                return true;
            }

        return false;
    }

    callEvents(eventName, data){
        if (!this.peer ) return  null;

        for (let i=0; i<this.peer.eventSubscribers.length; i++)
            if (this.peer.eventSubscribers[i].eventName === eventName){
                this.peer.eventSubscribers[i].callback(data);
            }

        //deleting once events...
        for (let i=this.peer.eventSubscribers.length-1; i>=0; i--)
            if ((this.peer.eventSubscribers[i].eventName === eventName) && (this.peer.eventSubscribers[i].type === "once"))
                this.peer.eventSubscribers.splice(i,1);

    }


    /*
        EXTRACTING DATA from DESCRIPTIONS
     */

    extractCharsUntilInvalid(str, pos, invalidChars){

        invalidChars = invalidChars||'';

        let subStr = '';

        while (pos > -1 && pos < str.length && invalidChars.indexOf(str[pos]) === -1){

            subStr += str[pos];

            pos ++ ;
        }

        if (subStr.length > 0)
            subStr = subStr.trim();

        return subStr;

    }

    extractValueFromDescription(str, text){

        let pos=-1, ok = false;
        let data = [];

        while (ok === false || pos > -1){
            ok = true;
            pos = str.indexOf(text, pos+1);
            if (pos > -1){
                pos += text.length;
                let subStr = this.extractCharsUntilInvalid(str, pos, '\n↵');
                if (subStr !== '') data.push(subStr);

                //console.log("extractValueFromDescription",text, pos, subStr);
            }

        }

        return data;
    }

    processDescription(description) {

        let str = '';
        if (description.sdp) {
            str = description.sdp;
            if (typeof str === "object" && !str.sdp) str = str.sdp;
        }

        if (description.candidate) str = description.candidate;

        if (typeof str === "string") {


            let ip4 = this.extractValueFromDescription(str, "IP4");
            let ip6 = this.extractValueFromDescription(str, "IP6");
            let candidate = this.extractValueFromDescription(str, "candidate:");

            console.log("str", str);
            console.log("IP4=", ip4);
            console.log("IP6=", ip6);
            console.log("candidate=", candidate);

            let address = '';

            if (candidate && candidate.length > 0) {

                str = candidate;
                let data = str;

                let done = false;

                //candidate:1853887674 2 udp 1518280447 47.61.61.61 36768 typ srflx raddr 192.168.0.196 rport 36768 generation 0
                for (let i = 0; i < data.length && !done; i++) {

                    let element = data[i].split(" ");
                    console.log("candiate", data[i], element);

                    if (Array.isArray(element) && element.length > 1) {
                        for (let j = 0; j < element.length; j++)
                            if (element[j] === "udp" || element[j] === "tcp")
                                if (j + 2 < element.length && element[j+2].length > 5 && element[j+2].indexOf(".") > -1) {
                                    address = element[j+2];
                                    done = true;
                                    break;
                                }
                    }
                    else if (data[i] === "udp" || data[i] === "tcp")
                        if (i + 2 < data.length && data[i+2].length > 5 && data[i+2].indexOf(".") > -1) {
                            address = data[i+2];
                            break;
                        }
                }


            }

            if (address === '' && ip6.length > 0)
                address = ip6[ip6.length - 1];

            if (address === '' && ip4.length > 0)
                address = ip4[ip4.length - 1];

            console.log("address",address);

            return ({address: address, port: undefined,})

        }
    }

}




exports.NodeWebPeerRTC = NodeWebPeerRTC;