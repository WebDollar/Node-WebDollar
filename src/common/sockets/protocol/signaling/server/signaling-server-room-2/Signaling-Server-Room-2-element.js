class SignalingServerRoomConnectionObject {

    /*
        webPeer1 - initiator
        webPeer2 -
     */
    constructor( socket, connectionsLeft, ){

        this.socket = socket;
        this.connectionsLeft = connectionsLeft;

        this.listConnected = [];
        this.listErrors = [];
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