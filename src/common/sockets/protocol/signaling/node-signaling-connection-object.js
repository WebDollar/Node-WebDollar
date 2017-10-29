NodeSignalingConnectionObject.ConnectionStatus = {
    initiatorSignalGenerated : 0,
    answerSignalGenerated: 1,
    connectionEstablished : 2
};

class NodeSignalingConnectionObject {

    constructor(webPeer1, webPeer2, status){

        this.webPeer1 = webPeer1;
        this.webPeer2 = webPeer2;
        this.status = status;

        this.established = false;
        this.connectingNow = false;

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
exports.NodeSignalingConnectionObject.ConnectionStatus = NodeSignalingConnectionObject.ConnectionStatus;