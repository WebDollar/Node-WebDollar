import SignalingClientList from "./signaling-client-list"
import NodeSignalingClientProtocol from "./../Node-Signaling-Client-Protocol"

class SignalingClientPeerObject {

    /*
        webPeer
        uuid
     */

    constructor(webPeer, uuid, signalingClientType){

        this.webPeer = webPeer;
        this.uuid = uuid;
        this.signalingClientType = signalingClientType;

        this.lastTimeChecked = 0;

        let timeout = setTimeout(()=>{

            console.error("Signaling Client Peer Object Timeout");
            SignalingClientList.deleteWebPeerSignalingClientList(uuid);

            NodeSignalingClientProtocol.sendErrorConnection(webPeer);

        }, 10*1000);

        webPeer.emitter.on("connect",()=>{

            clearTimeout(timeout);
            NodeSignalingClientProtocol.sendSuccessConnection(webPeer);

        });

    }

    refreshLastTimeChecked(){
        this.lastTimeChecked = new Date().getTime();
    }


}

export default SignalingClientPeerObject;