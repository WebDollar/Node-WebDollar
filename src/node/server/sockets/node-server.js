let io = require('socket.io');
import {sendRequest, sendRequestWaitOnce, sendRequestSubscribe, subscribeSocketObservable} from './../../../common/sockets/sockets.js';

/*
    TUTORIAL

    socket.emit('request', {); // emit an event to the socket
    io.emit('broadcast', {); // emit an event to all connected sockets
    socket.on('reply', function(){  }); // listen to the event
 */

class NodeServer {

    /*
        nodeServer : null,        //Node IO Server Socket
        nodeServerSockets = []      //list of current node

        nodeClientsService = null
    */

    constructor(){

        console.log("NodeServer constructor");
        this.nodeServer = null;
        this.nodeServerSockets = [];

        this.nodeClientsService = null;
    }

    startServer(){

        this.nodeServer = null;

        try
        {
            let server = io();

            server.on('connection', function(socket){

                var address = socket.handshake.address;
                console.log('New connection from ' + address.address + ':' + address.port);

            });

            server.listen(8320);

            this.nodeServer = server;
        }
        catch(Exception){
            console.log("Error Starting Node Server ", Exception.toString());
            return false;
        }

        console.log("Node Server Started");
        return true;
    }


    setNodeClientsService(nodeClientsService){
        if (nodeClientsService !== null){
            this.nodeClientsService = nodeClientsService;
            nodeClientsService.nodeServer = this;
        }
    }

    searchNodeServerSocketByAddress(address, searchOther){

        searchOther = searchOther || false;
        address = address.toLowerCase();

        for (let i=0; i<this.nodeServerSockets.length; i++)
            if (this.nodeServerSockets[i].address.toLowerCase() === address){
                return this.nodeServerSockets[i];
            }

        //check for avoiding double connections
        if ((searchOther) && (this.nodeClientsService !== null))
            return this.nodeClientsService.searchNodeClientByAddress(address, false);

        return null;
    }


}

exports.NodeServer =  NodeServer;