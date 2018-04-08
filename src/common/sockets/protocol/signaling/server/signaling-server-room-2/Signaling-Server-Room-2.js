import SignalingServerRoom2Element from "./Signaling-Server-Room-2-element";
import SignalingServerRoomConnectionObject from './../signaling-server-room/signaling-server-room-connection-object'

class SignalingServerRoom2{

    constructor(){

        this.room = [];
        this.lastConnectionsId = 0;

    }

    addSocketToRoom(socket, timeLeft, uuid ){

        let roomElement = this.searchSocketRoom(socket);

        if (roomElement === null){
            new SignalingServerRoom2Element(socket,  timeLeft, uuid);
        }

        this.room.push( roomElement );

        return roomElement;

    }

    searchSocketRoom(socket){

        for (let i=0; i<this.room.length; i++)
            if (this.room[i].socket === socket){
                return this.room[i];
            }

        return null;
    }

    canSocketsConnect(client1, client2) {

        //previous established connection
        let room1 = this.searchSocketRoom(client1);
        let room2 = this.searchSocketRoom(client2);

        if (room1 === null || room2 === null) return false;

        if (room1.containsConnectedSocket(client2)) return false;
        if (room2.containsConnectedSocket(client1)) return false;

        if (room1.containsErrorSocket(client2)) return false;
        if (room2.containsErrorSocket(client1)) return false;

        return true;
    }

    createConnection( client1, client2 ){
        return new SignalingServerRoomConnectionObject( client1, client2, SignalingServerRoomConnectionObject.ConnectionStatus.initiatorSignalGenerating, ++this.lastConnectionsId);
    }

}

export default new SignalingServerRoom2();