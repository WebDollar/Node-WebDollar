import {GeoLocationLists} from './geolocation-lists/geolocation-lists.js';
import {SocketAddress} from './../../common/sockets/socket-address.js';
import {NodeListObject} from './node-list-object.js';

/*
    The List is populated with Node Sockets only if the socket pass the Hello Message
 */

class NodeLists {

    // nodes = []

    constructor(){

        console.log("NodeLists constructor");

        this.nodes = [];
    }


    searchNodeSocketAddress(sckAddress, type){

        if (typeof type === 'undefined') type = 'all';

        sckAddress = SocketAddress.createSocketAddress(sckAddress);

        for (let i=0; i<this.nodes.length; i++)
            if ( (this.nodes[i].type === type || type  === "all") && (this.nodes[i].socket.node.sckAddress.matchAddress(sckAddress))){
                return this.nodes[i];
            }

        return null;
    }

    addUniqueSocket(socket, type){

        if (type === 'undefined'){
            throw ("type is necessary");
        }

        socket.node.type = type;

        if (this.searchNodeSocketAddress(socket) === null) {

            let object = new NodeListObject(socket, type);
            this.nodes.push(object);

            GeoLocationLists.includeSocket(socket);

            return true;
        }

        console.log("ERROR!!! Already connected to ",socket.sckAddress.getAddress(true) );
        socket.disconnect();
        return false;
    }

    //Removing socket from the list (the connection was terminated)
    disconnectSocket(socket, type){


        if ((socket.node.protocol.helloValidated|| false)===false) {
            console.log("disconnectSocket rejected by invalid helloValidated", socket.helloValidated);
            return false;
        }

        if (typeof type === 'undefined') type = 'all';

        //console.log("disconnecting", socket, this.nodes);

        for (let i=this.nodes.length-1; i>=0; i--)
            if ((this.nodes[i].type === type || type  === "all") && (this.nodes[i].socket.node.sckAddress.matchAddress(socket.node.sckAddress))) {
                console.log('deleting client socket ',i, socket.node.sckAddress.toString());
                this.nodes.splice(i, 1);

                socket.disconnect(true);
                return true;
            }

        console.log("Disconnecting Socket ",socket.node.sckAddress.getAddress()," but it was not validated before...");
        return false;
    }

    //return the JOIN of the clientSockets and serverSockets
    getNodes(type){

        if (typeof type === 'undefined') type = 'all';

        let list = [];

        for (let i=0; i<this.nodes.length; i++)
            if (this.nodes[i].type === type || type  === "all") {

                list.push( this.nodes[i] );

            }

        return list;
    }

}

exports.NodeLists =  new NodeLists();