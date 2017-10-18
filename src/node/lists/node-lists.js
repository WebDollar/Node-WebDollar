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

        //in case address is a Socket
        if (typeof address === 'object') address = address.address||'';

        address = (address||'').toLowerCase();

        if (searchClientSockets)
            for (let i=0; i<this.clientSockets.length; i++)
                if (this.clientSockets[i].address === address){
                    return this.clientSockets[i];
                }

        if (searchServerSockets)
            for (let i=0; i<this.serverSockets.length; i++)
                if (this.serverSockets[i].address === address){
                    return this.serverSockets[i];
                }


        return null;
    }

    addUniqueSocket(socket, bClient, bServer){

        bClient = bClient || false;
        bServer = bServer || false;

        if (bClient)
            if (this.searchNodeSocketAddress(socket) === null) {
                this.clientSockets.push(socket);
                GeoLocationLists.includeSocket(socket);
                return true;
            }

        if (bServer)
            if (this.searchNodeSocketAddress(socket) === null) {
                this.serverSockets.push(socket);
                GeoLocationLists.includeSocket(socket);
                return true;
            }

        socket.disconnect();
        return false;
    }

    //Removing socket from the list (the connection was terminated)
    disconnectSocket(socket, bClient, bServer){

        console.log("disconnectSocket", socket.helloValidated);

        if ((socket.helloValidated|| false)===false) return false;
        if (typeof bClient === 'undefined') bClient = true;
        if (typeof bServer === 'undefined') bServer = true;

        if (bClient)
            for (let i=this.clientSockets.length-1; i>=0; i--)
                if (this.clientSockets[i] === socket) {
                    console.log('deleting client socket ',i, socket.address);
                    socket.disconnect();
                    delete this.clientSockets[i];
                    this.serverSockets.splice(i, 1);
                    return true;
                }

        if (bServer)
            for (let i=this.serverSockets.length-1; i>=0; i--)
                if (this.serverSockets[i] === socket) {
                    console.log('deleting server socket ',i, socket.address);
                    socket.disconnect();
                    delete this.serverSockets[i];
                    this.serverSockets.splice(i, 1);
                    return true;
                }
        return false;
    }

}

exports.NodeLists =  new NodeLists();