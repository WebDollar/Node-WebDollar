class SignalingClientPeerObject {

    /*
        webPeer

     */
    constructor(webPeer){

        this.webPeer = webPeer;

        this.lastTimeChecked = 0;
    }

    refreshLastTimeChecked(){
        this.lastTimeChecked = new Date().getTime();
    }


}

exports.SignalingClientPeerObject = SignalingClientPeerObject;