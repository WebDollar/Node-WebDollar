import {GeoLocationLists} from './geolocation-lists/geolocation-lists.js';

/*
    The List is populated with Node Sockets only if the sockets pass the Hello Message
 */

class NodeLists {

    // clientSockets : [],
    // serverSockets : [],

    constructor(){

        console.log("NodeLists constructor");

        this.clientSockets = [];
        this.serverSockets = [];
    }


    searchNodeSocketAddress(address, searchClientSockets, searchServerSockets){

        if (typeof searchClientSockets === 'undefined') searchClientSockets = true;
        if (typeof searchServerSockets === 'undefined') searchServerSockets = true;
        address = (address||'').toLowerCase();

        if (searchClientSockets)
            for (let i=0; i<this.clientSockets.length; i++)
                if (this.clientSockets[i].request.connection.remoteAddress.toLowerCase() === address){
                    return this.clientSockets[i];
                }

        if (searchServerSockets)
            for (let i=0; i<this.serverSockets.length; i++)
                if (this.serverSockets[i].request.connection.remoteAddress.toLowerCase() === address){
                    return this.serverSockets[i];
                }


        return null;
    }

    checkAddSocket(socket, bClient, bServer){

        if (bClient)
            if (this.searchNodeSocketAddress(socket) === null) {
                this.clientSockets.push(socket);
                GeoLocationLists.includeAddress(socket.request.connection.remoteAddress);
                return true;
            }

        if (bServer)
            if (this.searchNodeSocketAddress(socket) === null) {
                this.serverSockets.push(socket);
                GeoLocationLists.includeAddress(socket.request.connection.remoteAddress);
                return true;
            }

        else socket.disconnect();
        return false;
    }

    //Removing socket from the list (the connection was terminated)
    disconnectSocket(socket, bClient, bServer){

        if ((socket.helloValidated|| false)===false) return false;

        if (bClient)
            for (let i=0; i<this.clientSockets.length; i++)
                if (this.clientSockets[i].request.connection.remoteAddress === socket.request.connection.remoteAddress){
                    delete this.clientSockets[i];
                }

        if (bServer)
            for (let i=0; i<this.serverSockets.length; i++)
                if (this.serverSockets[i].request.connection.remoteAddress === socket.request.connection.remoteAddress){
                    delete this.serverSockets[i];
                }
    }

}

exports.NodeLists =  new NodeLists();