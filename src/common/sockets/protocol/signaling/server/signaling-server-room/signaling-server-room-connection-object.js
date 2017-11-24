let ConnectionStatus = {

    initiatorSignalGenerating: 0,
    initiatorSignalGenerated : 1,

    answerSignalGenerating: 2,
    answerSignalGenerated: 3,

    peerConnectionEstablishing: 4,
    peerConnectionEstablished : 5,
    peerConnectionNotEstablished : 6,

    peerConnectionAlreadyConnected: 44,
};


class SignalingServerRoomConnectionObject {

    /*
        webPeer1 - initiator
        webPeer2 -
     */
    constructor(client1, client2, status, id ){

        this.client1 = client1;
        this.client2 = client2;
        this.status = status;
        this.id = id;

        this.errorTrials = 0;

        this.established = false;
        this.connectingNow = false;

        this.lastTimeChecked = 0;
        this.lastTimeConnected = 0;
    }

    refreshLastTimeErrorChecked(){
        this.errorTrials++;
        this.status = ConnectionStatus.peerConnectionNotEstablished;
        this.lastTimeChecked = new Date().getTime();
    }

    checkLastTimeChecked(timeTryReconnectAgain){

        let time = new Date().getTime();

        if ( (time - this.lastTimeChecked) >= ( timeTryReconnectAgain + this.errorTrials*5000 ))
            return true;

        return false;
    }

    refreshLastTimeConnected(){
        this.errorTrials = 0;
        this.status = ConnectionStatus.peerConnectionEstablished;
        this.lastTimeConnected = new Date().getTime();
    }

}

SignalingServerRoomConnectionObject.ConnectionStatus = ConnectionStatus;

export default SignalingServerRoomConnectionObject