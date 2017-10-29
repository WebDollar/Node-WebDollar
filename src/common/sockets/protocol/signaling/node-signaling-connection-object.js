class NodeSignalingConnectionObject {

    constructor(webPeer1, webPeer2){

        this.webPeer1 = webPeer1;
        this.webPeer2 = webPeer2;

        this.established = false;

        this.lastTimeChecked = 0;
    }

    refreshLastTimeChecked(){
        this.lastTimeChecked = new Date().getTime();
    }

    checkLastTimeChecked(nodeTryReconnectAgain){

        let time = new Date().getTime();

        if ( (time - this.lastTimeChecked) >= ( nodeTryReconnectAgain + this.errorTrials*1000 ))
            return true;

        return false;
    }

}

exports.NodeSignalingConnectionObject = NodeSignalingConnectionObject;