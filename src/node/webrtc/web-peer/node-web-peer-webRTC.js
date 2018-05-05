/*
    WEBRTC Node Peer
 */


// TUTORIAL BASED ON https://www.scaledrone.com/blog/posts/webrtc-chat-tutorial

const EventEmitter = require('events');
import SocketExtend from 'common/sockets/socket-extend'
import NodesList from 'node/lists/nodes-list'
import NodeSignalingClientProtocol from 'common/sockets/protocol/signaling/client/Node-Signaling-Client-Protocol';
import CONNECTIONS_TYPE from "node/lists/types/Connections-Type"
import consts from 'consts/const_global'

let RTCPeerConnection;
let RTCSessionDescription;
let RTCIceCandidate;

if (typeof window !== "undefined") {
    RTCPeerConnection = window.RTCPeerConnection;
    RTCSessionDescription = window.RTCSessionDescription;
    RTCIceCandidate = window.RTCIceCandidate;
}


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

        if (consts.DEBUG)
            console.log("Peer WebRTC Client constructor");

        this.peer = null;

        this.emitter = new EventEmitter();
        this.emitter.setMaxListeners(20);

        this._messages = [];

    }

    createPeer(initiator, socketSignaling, signalingServerConnectionId, callbackSignalingServerSendIceCandidate, remoteAddress, remoteUUID, remotePort, level){

        console.log('Using SCTP based data channels');

        // SCTP is supported from Chrome 31 and is supported in FF.
        // No need to pass DTLS constraint as it is on by default in Chrome 31.
        // For SCTP, reliable and ordered is true by default.
        // Add localConnection to global scope to make it visible
        // from the browser console.

        this.peer =  new RTCPeerConnection(config);

        this.peer.connected = false;
        this.enableEventsHandling();

        this.peer.onicecandidate = (event) => {

            if (!event || !event.candidate) return;


            //console.log("onicecandidate",event.candidate);
            callbackSignalingServerSendIceCandidate(event.candidate);

        };

        /*
            keeping information about new connection
         */
        this.peer.signaling = {};
        this.peer.signaling.socketSignaling = socketSignaling;
        this.peer.signaling.connectionId =  signalingServerConnectionId;
        this.peer.inputSignalsQueue = [];

        console.log('Created webRTC peer', "initiator", initiator, "signalingServerConnectionId", signalingServerConnectionId, "remoteAddress", remoteAddress, "remoteUUID", remoteUUID, "remotePort", remotePort);

        this.peer.disconnect = () => {

            this.emitter.removeAllListeners();
            delete this._messages;

            this.peer.close()
        };

        this.socket =  this.peer;
        this.peer.signalData = null;
        this.peer.signalInitiatorData = null;


        this.peer.on('error', err => { console.log('error', err) } );

        this.peer.on('connect',async () => {

            console.log('WEBRTC PEER CONNECTED', this.peer);

            let remoteData = this.processDescription(this.peer.remoteDescription);


            this.peer.remoteAddress = remoteAddress||remoteData.address;
            this.peer.remoteUUID = remoteUUID||remoteData.uuid;
            this.peer.remotePort = remotePort||remoteData.port;

            SocketExtend.extendSocket(this.peer, this.peer.remoteAddress,  this.peer.remotePort, this.peer.remoteUUID, socketSignaling.node.level + 1 );

            this.peer.node.protocol.sendHello(["uuid"]).then( (answer)=>{

                if (answer)
                    this.initializePeer(["uuid"]);
                else
                    this.peer.disconnect()

            });

        });


        this.peer.on('data', (data) => {
            console.log('data: ' , data)
        });



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


    }

    createSignalInitiator(){

        this.peer.signalData = null;


        let promise = new Promise ( (resolve) => {

            // emitter - signal
            // If user is offerer let them create a negotiation offer and set up the data channel
            this.peer.onnegotiationneeded = () => {

                this.peer.createOffer(

                    (desc)=>{
                        this.peer.setLocalDescription(
                            desc,
                            async () => {
                                this.peer.signalData = {"sdp": this.peer.localDescription};
                                this.peer.signalInitiatorData = this.peer.signalData;

                                //this.peer.setLocalDescription = true;

                                resolve(  {result: true, signal: this.peer.signalData} );

                                // for (let i=0; i<this.peer.inputSignalsQueue.length; i++) {
                                //     let answer = await this.createSignal(this.peer.inputSignalsQueue[i].inputSignal);
                                //     this.peer.inputSignalsQueue[i].resolve(answer);
                                // }


                            },
                            (error) => {
                                resolve({result:false, message: "Generating Initiator - Error Setting Local Description " +error.toString()});
                                console.error("Generating Initiator - Error Setting Local Description ", error);
                            }
                        );
                    },
                    (error) => {
                        resolve({result:false, message: "Error Creating Offer " +error.toString()});
                        console.error("Error Creating Offer ", error);
                    });
            };
        });


        return promise;

    }


    createSignal(inputSignal){

        this.peer.signalData = null;


        let promise = new Promise ( (resolve) => {

            //answer
            if (typeof inputSignal === "string") {
                try {
                    inputSignal = JSON.parse(inputSignal);
                } catch (exception){
                    console.error("Error processing JSON createSignal", inputSignal, exception);
                    resolve({result:false, message: "Invalid input signal"});
                    return;
                }
            }


            if (this.peer.connected === true){
                console.error("Error - Peer Already connected");
                resolve({result:false, message: "Already connected in the past"});
                return;
            }


            if (inputSignal.sdp) {

                // This is called after receiving an offer or answer from another peer
                this.peer.setRemoteDescription(new RTCSessionDescription(inputSignal.sdp), async () => {

                    console.log('pc.remoteDescription.type', this.peer.remoteDescription.type);

                    // When receiving an offer lets answer it
                    if (this.peer.remoteDescription.type === 'offer') {
                        console.log('Answering offer');

                        this.peer.signalInitiatorData = inputSignal;

                        this.peer.createAnswer(
                            (desc)=>{
                                this.peer.setLocalDescription(
                                    desc,
                                    async () => {

                                        this.peer.signalData = {'sdp': this.peer.localDescription};
                                        this.peer.setLocalDescription = true;

                                        resolve(  {result: true, signal: this.peer.signalData}  );

                                        for (let i=0; i<this.peer.inputSignalsQueue.length; i++) {
                                            let answer = await this.createSignal(this.peer.inputSignalsQueue[i].inputSignal);
                                            this.peer.inputSignalsQueue[i].resolve(answer);
                                        }

                                    },
                                    error => {
                                        console.error("Error Setting Local Description",error);
                                        resolve({result:false, message: "Error Setting Local Description"+error.toString()});
                                    }
                                )
                            },
                            error => {
                                console.error("Error Creating Answer ",error);
                                resolve({result:false, message: "Error Creating Answer "+error.toString() });
                            });

                    } else { //answer nothing else

                        this.peer.setLocalDescription = true;

                        for (let i=0; i<this.peer.inputSignalsQueue.length; i++) {
                            let answer = await this.createSignal(this.peer.inputSignalsQueue[i].inputSignal);
                            this.peer.inputSignalsQueue[i].resolve(answer);
                        }

                        resolve({result: true, message: ""})
                    }

                }, error => {
                    console.error("Error setRemoteDescription", error);
                    resolve({result:false, message: "setRemoteDescription failed"});
                });



            } else if (inputSignal.candidate) {

                // Add the new ICE candidate to our connections remote description
                try {

                    if (consts.DEBUG)
                        console.log("inputSignal.candidate", inputSignal);

                    if (this.peer.setLocalDescription === true) {

                        let candidate = new RTCIceCandidate(inputSignal.candidate);
                        this.peer.addIceCandidate(candidate);

                        resolve({result: true, message:"iceCandidate successfully introduced"});

                    } else {
                        this.peer.inputSignalsQueue.push( { inputSignal: inputSignal, resolve: resolve });
                    }

                } catch (Exception){
                    resolve({result:false, message: "iceCandidate error ", exception: Exception });
                    console.error("iceCandidate error", inputSignal.candidate);
                }
            }

        });


        return promise;
    }

    async joinAnswer(inputSignal){
        return await this.createSignal(inputSignal);
    }

    // Hook up data channel event handlers
    setupDataChannel() {
        this.checkDataChannelState();
        this.peer.dataChannel.onopen = ()=>{this.checkDataChannelState()};
        this.peer.dataChannel.onclose = ()=>{ this.checkDataChannelState()};
        this.peer.dataChannel.onerror = ()=>{ this.checkDataChannelState()};

        this.peer.oniceconnectionstatechange = () => {

            if(this.peer.iceConnectionState === 'disconnected') {
                console.log('iceConnection Disconnected');
                if (this.peer.connected === true) {
                    this.peer.connected = false;

                    this.emitter.emit("disconnect", {})
                }
            }
        };

        this.peer.dataChannel.onmessage = (event) => {

            try {
                let data  = event.data;

                if (data.indexOf("chunk") === 0){

                    let pos = data.indexOf("chunk");
                    let index = data.substr( pos + "chunk".length,  data.indexOf("/") - pos - "chunk".length );
                    let chunks = data.substr( data.indexOf("/")+1, data.indexOf("@") - data.indexOf("/")-1 );
                    let id = data.substr( data.indexOf("@")+1, data.indexOf("#") - data.indexOf("@")-1 );
                    let value = data.substr( data.indexOf("#")+1);

                    let done = false;
                    let message = undefined;

                    if (chunks > 0){

                        //let's find _messages
                        message = this._findMessages(id);

                        if (message === null) {
                            this._messages.push({
                                id: id,
                                chunks: {},
                                timestamp: new Date(),
                            });

                            message = this._messages[this._messages.length-1];
                        }

                        message.chunks[index] = value;

                        done = true;

                        for (let i=0; i < chunks; i++)
                            if (message.chunks[i] === undefined){
                                done = false;
                                break;
                            }

                    } else {
                        done = true;
                    }

                    if (done){

                        if (chunks > 0) {
                            data = '';
                            for (let i = 0; i < chunks; i++)
                                data = data + message.chunks[i];
                        } else
                            data = value;

                        data = JSON.parse(data);

                        let name = data.name;
                        let value = data.value;

                        if (name !== '') {
                            this.emitter.emit(name, value);
                        }

                    }



                }



            } catch (exception){
                console.error("Error onMessage", event.data, exception);
            }

            //console.log("DATA RECEIVED# ################", data);
        }

    }

    checkDataChannelState() {

        console.log('WebRTC channel state is:', this.peer.dataChannel.readyState);

        if (this.peer.dataChannel.readyState === 'open') {
            if (!this.peer.connected ) {
                this.peer.connected = true;
                this.emitter.emit("connect", {});
            }
        }

        if (this.peer.dataChannel.readyState === 'closed') {
            if (this.peer.connected){
                this.peer.connected = false;
                this.emitter.emit("disconnect", {});
            }
        }
    }


    initializePeer(validationDoubleConnectionsTypes){

        //it is not unique... then I have to disconnect
        if (NodesList.registerUniqueSocket(this.peer, CONNECTIONS_TYPE.CONNECTION_WEBRTC, this.peer.node.protocol.nodeType, validationDoubleConnectionsTypes) === false){
            return false;
        }

        // signaling service on webpeer
        this.peer.node.protocol.signaling.server.initializeSignalingServerService();

        this.peer.on("disconnect", ()=>{

            console.log("Peer disconnected", this.peer.node.sckAddress.getAddress());
            NodesList.disconnectSocket( this.peer );

            NodeSignalingClientProtocol.webPeerDisconnected(this);

        });

    }

    /*
        EVENTS HANDLING for
        .on
        .once
        .off

     */

    enableEventsHandling(){

        this.peer.errorTrials = 0;

        this.peer.on = (name, callback)=>{ this.emitter.on(name, callback) };

        this.peer.once = (name, callback)=>{ this.emitter.once(name, callback) };

        this.peer.off = (id)=>{ this.emitter.off(id) };

        this.peer.send = (name, value) =>{

            let data = {name: name, value: value};

            if (this.peer.dataChannel.readyState !== "open") {

                console.error("Error sending data to webRTC because it is not open", data);
                this.peer.errorTrials++;

                if (this.peer.errorTrials > 5) {

                    NodesList.disconnectSocket( this.peer );
                    console.warn("I deleted socket", this.peer.errorTrials);

                }

                return null;
            }

            data = JSON.stringify(data);

            //webrtc must have 16kb per message
            const SIZE = 16*1024-100;
            let chunks = data.length / SIZE;
            let id = Math.floor( Math.random() * 10000000000);

            let i=0;
            while (i < chunks){

                this.peer.dataChannel.send("chunk"+i+"/"+chunks+"@"+id+"#"+data.substr(i*SIZE, SIZE ));
                i++;
            }

        };
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

            // console.log("str", str);
            // console.log("IP4=", ip4);
            // console.log("IP6=", ip6);
            // console.log("candidate=", candidate);

            let address = '';

            if (candidate && candidate.length > 0) {

                str = candidate;
                let data = str;

                let done = false;

                //candidate:1853887674 2 udp 1518280447 47.61.61.61 36768 typ srflx raddr 192.168.0.196 rport 36768 generation 0
                for (let i = 0; i < data.length && !done; i++) {

                    let element = data[i].split(" ");
                    //console.log("candiate", data[i], element);

                    if (Array.isArray(element) && element.length > 1) {
                        for (let j = 0; j < element.length; j++)
                            if (element[j] === "udp" || element[j] === "tcp")
                                if (j + 2 < element.length && this.checkValidRemoteAddress(element[j+2])) {
                                    address = element[j+2];
                                    done = true;
                                    break;
                                }
                    }
                    else if (data[i] === "udp" || data[i] === "tcp")
                        if (i + 2 < data.length && this.checkValidRemoteAddress(element[j+2])) {
                            address = data[i+2];
                            break;
                        }
                }


            }

            if (address === '' && ip6.length > 0)
                address = ip6[ip6.length - 1];

            if (address === '' && ip4.length > 0)
                address = ip4[ip4.length - 1];

            if (address === "0.0.0.0")
                address = "127.0.0.1";

            console.log("address",address);

            return ({address: address, port: undefined,})

        }
    }

    checkValidRemoteAddress(ip) {

        //based on this https://www.arin.net/knowledge/address_filters.html

        if (ip.indexOf(".") <= 0) return false; //0.0 , but .0 invalid
        if (ip.length < 5  ) return false;  // 0.0.0.0

        if (ip.indexOf("192.168.") === 0 || ip.indexOf("10.") === 0) return false;

        for (let i = 17; i <= 31; i++)
            if (ip.indexOf("172." + i.toString() + ".") === 0) return false;

        return true;
    }


    _findMessages(id){
        for (let i=0; i<this._messages.length; i++)
            if (this._messages[i].id === id)
                return this._messages[i];

        return null;
    }

}




export default NodeWebPeerRTC;