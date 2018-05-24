let ConnectionStatus = {

    initiatorSignalGenerating: 0,
    initiatorSignalGenerated : 1,

    answerSignalGenerating: 2,
    answerSignalGenerated: 3,

    peerConnectionEstablishing: 4,
    peerConnectionEstablished : 5,
    peerConnectionNotEstablished : 6,

    peerConnectionAlreadyConnected: 44,

    peerConnectionError: 66,
};


class SignalingServerRoomConnectionObject {

    /*
        webPeer1 - initiator
        webPeer2 -
     */
    constructor(client1, client2, status, id ){

        this.client1 = client1;
        this.client2 = client2;
        this._status = status;
        this.id = id;

        this.errorTrials = 0;

        this.established = false;

        this.lastTimeChecked = 0;
        this.lastTimeConnected = 0;
    }

    checkLastTimeChecked(timeTryReconnectAgain){

        let time = new Date().getTime();

        if ( (time - this.lastTimeChecked) >= ( timeTryReconnectAgain + this.errorTrials*2000 ))
            return true;

        return false;
    }

    set status(newValue){

        this._status = newValue;

        if (newValue === ConnectionStatus.peerConnectionEstablished) {

            this.errorTrials = 0;
            this.lastTimeConnected = new Date().getTime();
            this.lastTimeChecked = new Date().getTime();

        }
        else
        if ( [ ConnectionStatus.peerConnectionNotEstablished, ConnectionStatus.peerConnectionError ].indexOf(newValue) !== -1 ){
            this.errorTrials++;
            this.lastTimeChecked = new Date().getTime();
        }

    }

    get status(){
        return this._status;
    }

}

SignalingServerRoomConnectionObject.ConnectionStatus = ConnectionStatus;

export default SignalingServerRoomConnectionObject