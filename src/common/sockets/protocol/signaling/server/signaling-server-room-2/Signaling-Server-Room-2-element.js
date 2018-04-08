class SignalingServerRoomConnectionObject {

    /*
        webPeer1 - initiator
        webPeer2 -
     */
    constructor( socket, timeLeft, connectionUUID ){

        this.socket = socket;

        this.listConnected = [];
        this.listErrors = [];

        this.listPending = [ {
            timeLeft: timeLeft,
            connectionUUID: connectionUUID,
        } ];
    }

    containsConnectedSocket(socket){

        for (let i=0; i<this.listConnected.length; i++)
            if (this.listConnected[i].socket === socket) return i;

        return -1;
    }

    containsErrorSocket(socket){
        for (let i=0; i<this.listErrors.length; i++)
            if (this.listErrors[i].socket === socket) return i

        return -1;
    }

}

export default SignalingServerRoomConnectionObject