class SignalingRoomListObject {

    /*
        previousSocketsConnected = []
        params = []
        socket = null;
     */

    constructor(socket, params){

        this.socket = socket;
        this.params = params;

        this.previousSocketsConnected = [];
    }

}

exports.SignalingRoomListObject = SignalingRoomListObject;