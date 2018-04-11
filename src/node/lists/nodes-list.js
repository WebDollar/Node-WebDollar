import GeoLocationLists from 'node/lists/geolocation-lists/geolocation-lists'
import SocketAddress from 'common/sockets/socket-address'
import NodesListObject from './node-list-object.js';

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
        this.emitter.setMaxListeners(100);

        this.nodes = [];
        this.nodesTotal = 0;

        this.removeDisconnectedSockets();
    }


    searchNodeSocketByAddress(sckAddress, connectionType, validationDoubleConnectionsTypes){

        if (connectionType === undefined) connectionType = 'all';

        sckAddress = SocketAddress.createSocketAddress(sckAddress);

        for (let i=0; i<this.nodes.length; i++)
            if ( (this.nodes[i].connectionType === connectionType || connectionType === "all") && (this.nodes[i].socket.node.sckAddress.matchAddress(sckAddress, validationDoubleConnectionsTypes))){
                return this.nodes[i];
            }

        return null;
    }

    registerUniqueSocket(socket, connectionType, type, validationDoubleConnectionsTypes){

        if (type === undefined) throw ("type is necessary");

        if (!socket.node || !socket.node.protocol || !socket.node.protocol.helloValidated ) {
            socket.disconnect(true);
            return false;
        }

        socket.node.connectionType = connectionType;
        socket.node.type = type;

        socket.node.index = ++this.nodesTotal;

        // avoiding double connections                              unless it is allowed to double connections
        if ( this.searchNodeSocketByAddress(socket, undefined, validationDoubleConnectionsTypes ) === null ) {

            // it is a unique connection, I should register this connection

            let object = new NodesListObject(socket, connectionType, type);
            this.nodes.push(object);

            this.emitter.emit("nodes-list/connected", object);

            GeoLocationLists.includeSocket(socket);

            return true;
        }

        console.error("Already connected to ", socket.node.sckAddress.getAddress(true));
        socket.disconnect(true);
        return false;
    }

    //Removing socket from the list (the connection was terminated)
    disconnectSocket(socket, connectionType){


        if (socket !== null && !socket.hasOwnProperty("node") ) {

            //console.error("Error - disconnectSocket rejected by invalid helloValidated");
            //if (socket.hasOwnProperty("node")) console.log("hello validated value",socket.node.protocol.helloValidated);
            socket.disconnect(true);
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

                socket.disconnect(true);
                return true;
            }

        //console.error("Disconnecting Socket but it was not validated before...", socket.node.sckAddress.getAddress());

        socket.disconnect(true);
        return false;
    }

    //return the JOIN of the clientSockets and serverSockets
    getNodes(connectionType){

        if ( connectionType === undefined) connectionType = 'all';

        let list = [];

        for (let i=0; i<this.nodes.length; i++)

            if (Array.isArray(connectionType)) { //in case type is an Array
                if (this.nodes[i].connectionType in connectionType)
                    list.push(this.nodes[i]);
            } else
            // in case type is just a simple string
            if (connectionType === this.nodes[i].connectionType || connectionType === "all")
                list.push(this.nodes[i]);

        return list;
    }

    countNodes(connectionType){

        if ( connectionType === undefined) connectionType = 'all';

        let count = 0;

        for (let i=0; i<this.nodes.length; i++)
            if (Array.isArray(connectionType)) { //in case type is an Array
                if (this.nodes[i].connectionType in connectionType)
                    count++;
            }
            else
            if (type === this.nodes[i].connectionType || connectionType === "all")
                count++;

        return count;
    }


    removeDisconnectedSockets(){

        for (let i=this.nodes.length-1; i>=0; i--)
            if (this.nodes[i].socket.disconnected)
                this.nodes.splice(i,1);

        setTimeout(()=>{this.removeDisconnectedSockets()}, 2000);
    }

}

export default new NodesList();