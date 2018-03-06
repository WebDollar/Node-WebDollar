class SignalingClientPeerObject {

    /*
        webPeer
        uuid

     */

    constructor(webPeer, uuid){

        this.webPeer = webPeer;
        this.uuid = uuid;

        this.lastTimeChecked = 0;
    }

    refreshLastTimeChecked(){
        this.lastTimeChecked = new Date().getTime();
    }


}

export default SignalingClientPeerObject;