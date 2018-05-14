import GeoLocationLists from 'node/lists/geolocation-lists/geolocation-lists'
import SocketAddress from 'common/sockets/protocol/extend-socket/Socket-Address'
import NodesListObject from './Mode-List-Object.js';
import CONNECTION_TYPE from "node/lists/types/Connections-Type";
import NodesWaitlist from 'node/lists/waitlist/Nodes-Waitlist'

const EventEmitter = require('events');

/*
    The List is populated with Node Sockets only if the socket pass the Hello Message
 */

class NodesList {

    // nodes = []               - storing the connected sockets
    // events = []              - used for callbacks

    constructor(){

        console.log("NodesList constructor");

        this.emitter = new EventEmitter();
        this.emitter.setMaxListeners(2000);

        this.nodes = [];
        this.nodesTotal = 0;

        this.removeDisconnectedSockets();
    }


    searchNodeSocketByAddress(sckAddress, connectionType, validationDoubleConnectionsTypes){

        if (connectionType === undefined) connectionType = 'all';

        sckAddress = SocketAddress.createSocketAddress(sckAddress);

        for (let i=0; i<this.nodes.length; i++)
            if ( (this.nodes[i].connectionType === connectionType || connectionType === "all") && (this.nodes[i].socket.node.sckAddress.matchAddress(sckAddress, validationDoubleConnectionsTypes)))
                return this.nodes[i];

        return null;
    }

    countNodeSocketByAddress(sckAddress, connectionType){

        if (connectionType === undefined) connectionType = "all";

        sckAddress = SocketAddress.createSocketAddress(sckAddress);

        let countUUIDs = 0, countIPs = 0;
        for (let i=0; i<this.nodes.length; i++)
            if (this.nodes[i].connectionType === connectionType || connectionType === "all") {

                if (this.nodes[i].socket.node.sckAddress.uuid === sckAddress.uuid)
                    countUUIDs++;
                else
                if (this.nodes[i].socket.node.sckAddress.address === sckAddress.address)
                    countIPs++;
            }

        return {countUUIDs: countUUIDs, countIPs: countIPs};

    }

    registerUniqueSocket(socket, connectionType, type, validationDoubleConnectionsTypes){

        if (type === undefined) throw {message: "type is necessary"};

        if (!socket.node || !socket.node.protocol || !socket.node.protocol.helloValidated ) {
            socket.disconnect();
            return false;
        }

        socket.node.connectionType = connectionType;
        socket.node.protocol.connectionType = connectionType;
        socket.node.type = type;

        // avoiding double connections                              unless it is allowed to double connections
        if ( this.searchNodeSocketByAddress(socket, undefined, validationDoubleConnectionsTypes ) === null ) {

            // it is a unique connection, I should register this connection

            let object = new NodesListObject(socket, connectionType, type, NodesWaitlist.isAddressFallback(socket.node.sckAddress));
            this.nodes.push(object);

            this.emitter.emit("nodes-list/connected", object);

            GeoLocationLists.includeSocket(socket);

            NodesWaitlist.addNewNodeToWaitlist( socket.node.sckAddress, undefined, socket.node.type, socket.node.protocol.nodeSSL, true, socket.node.level, socket, socket );

            return true;
        }

        console.error("Already connected to ", socket.node.sckAddress.getAddress(true));
        socket.disconnect();
        return false;
    }

    //Removing socket from the list (the connection was terminated)
    disconnectSocket(socket, connectionType){


        if (socket !== null && !socket.hasOwnProperty("node") ) {

            //console.error("Error - disconnectSocket rejected by invalid helloValidated");
            //if (socket.hasOwnProperty("node")) console.log("hello validated value",socket.node.protocol.helloValidated);
            socket.disconnect();
            return false;
        }

        if (connectionType === undefined) connectionType = 'all';

        //console.log("disconnecting", socket, this.nodes);

        for (let i=this.nodes.length-1; i>=0; i--)
            if ((this.nodes[i].connectionType === connectionType || connectionType  === "all") &&
                (this.nodes[i].socket === socket  || this.nodes[i].socket.node.sckAddress.uuid === socket.node.sckAddress.uuid   )) {

                console.error('deleting client socket '+ i +" "+ socket.node.sckAddress.toString());

                let nodeToBeDeleted = this.nodes[i];
                this.nodes.splice(i, 1);

                this.emitter.emit("nodes-list/disconnected", nodeToBeDeleted);

                socket.disconnect();
                return true;
            }

        //console.error("Disconnecting Socket but it was not validated before...", socket.node.sckAddress.getAddress());

        socket.disconnect();
        return false;
    }

    //return the JOIN of the clientSockets and serverSockets
    getNodesByConnectionType( connectionType, fallback = undefined ){

        if ( connectionType === undefined) connectionType = 'all';

        let list = [];

        for (let i=0; i<this.nodes.length; i++)

            if ( Array.isArray(connectionType) ) { //in case type is an Array
                if ( connectionType.indexOf( this.nodes[i].socket.node.protocol.connectionType) >= 0 )
                    list.push(this.nodes[i]);
            } else
            // in case type is just a simple string
            if ( connectionType === this.nodes[i].socket.node.protocol.connectionType || connectionType === "all" )
                list.push(this.nodes[i]);

        return list;
    }

    //return the JOIN of the clientSockets and serverSockets
    getNodesByType(type){

        if ( type === undefined) type = 'all';

        let list = [];

        for (let i=0; i<this.nodes.length; i++)

            if (Array.isArray(type)) { //in case type is an Array
                if ( type.indexOf( this.nodes[i].socket.node.protocol.type) >= 0)
                    list.push(this.nodes[i]);
            } else
            // in case type is just a simple string
            if (type === this.nodes[i].socket.node.protocol.type || type === "all")
                list.push(this.nodes[i]);

        return list;
    }


    countNodesByConnectionType(connectionType, fallback){

        if ( connectionType === undefined) connectionType = 'all';

        let count = 0;

        for (let i=0; i<this.nodes.length; i++) {

            if (fallback !== undefined && this.nodes[i].isFallback !== fallback) continue;

            if (Array.isArray(connectionType)) { //in case type is an Array
                if (connectionType.indexOf(this.nodes[i].connectionType) >= 0)
                    count++;
            }
            else if (connectionType === this.nodes[i].connectionType || connectionType === "all")
                count++;
        }

        return count;
    }

    countNodesByType(nodeType){

        if ( nodeType === undefined) nodeType = 'all';

        let count = 0;

        for (let i=0; i<this.nodes.length; i++) {

            if (Array.isArray(nodeType)) { //in case type is an Array
                if (nodeType.indexOf(this.nodes[i].socket.node.protocol.nodeType) >= 0)
                    count++;
            }
            else if (nodeType === this.nodes[i].socket.node.protocol.nodeType || nodeType === "all")
                count++;

        }

        return count;
    }


    removeDisconnectedSockets(){

        for (let i=this.nodes.length-1; i>=0; i--)
            if (this.nodes[i].socket.disconnected)
                this.nodes.splice(i,1);

        setTimeout(()=>{this.removeDisconnectedSockets()}, 2000);
    }

    disconnectAllNodes(connectionType = CONNECTION_TYPE.CONNECTION_CLIENT_SOCKET){

        for (let i=this.nodes.length-1; i>=0; i--)
            if ( this.nodes[i].socket.node.protocol.connectionType === connectionType )
                this.nodes[i].socket.disconnect();

    }

}

export default new NodesList();