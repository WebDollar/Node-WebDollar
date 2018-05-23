import SocketAddress from 'common/sockets/protocol/extend-socket/Socket-Address'
import SignalingServerRoomConnectionObject from './Signaling-Server-Room-Connection-Object';
import NodesList from 'node/lists/Nodes-List'
import CONNECTIONS_TYPE from "node/lists/types/Connections-Type"
import NODES_TYPE from "node/lists/types/Nodes-Type"

/*
    The List is populated with Node Sockets who are available for WebRTC
 */

class SignalingServerRoomList {

    // signalingRoom = []               - storing the connected sockets
    // events = []                      - used for callbacks

    constructor() {

        console.log("SignalingRoomList constructor");

        this.list = {}; //it could extend with HashMap

        //{type: ["webpeer", "client"]}
        NodesList.emitter.on("nodes-list/disconnected", (result ) => { this._disconnectedNode( result ) });

    }

    getConnectionUuid(client1, client2){

        if (client2.uuid < client1.uuid)
            return client2.node.sckAddress.uuid +"_"+ client1.node.sckAddress.uuid;

        return client1.node.sckAddress.uuid +"_"+ client2.node.sckAddress.uuid;
    }

    registerSignalingServerRoomConnection(client1, client2, status) {

        if (client1 === null || client2 === null)
            return null;

        let connection = this.searchSignalingServerRoomConnection(client1, client2);

        if (connection === undefined) {

            let roomConnectionObject = new SignalingServerRoomConnectionObject(client1, client2, status, this.getConnectionUuid(client1, client2) );

            this.list.push(roomConnectionObject);

            return roomConnectionObject;

        } else {
            //it was established before, now I only change the status
            connection.status = status;
        }

        return connection;
    }

    searchSignalingServerRoomConnection(client1, client2) {

        let uuid = this.getConnectionUuid(client1, client2);
        return this.list[uuid];
    }

    searchSignalingServerRoomConnectionById(uuid){

        return this.list[uuid];

    }

    _disconnectedNode(nodesListObject){

        if ( [ CONNECTIONS_TYPE.CONNECTION_SERVER_SOCKET, CONNECTIONS_TYPE.CONNECTION_WEBRTC].indexOf(nodesListObject.connectionType) < 0 ) return;    // signaling service on webpeer

        for (let key in this.list)
            if (this.list[key].client1 === nodesListObject.socket || this.list[key].client2 === nodesListObject.socket){
                this.list[key].client1 = undefined;
                this.list[key].client2 = undefined;
                this.list.splice(i, 1);
            }

    }

    removeServerRoomConnection( connection ) {

        for (let i=0; this.list.length; i++)
            if (this.list[i].id === connection.id){
                this.list.splice(i,1);
                return;
            }

    }


}

export default new SignalingServerRoomList();