let io = require('socket.io');

class NodeServer {

    /*
        nodeServer : null,        //Node IO Server Socket
        nodeServerSockets = []      //list of current node
    */

    constructor(){

        console.log("NodeServer constructor");
        this.nodeServer = null;
        this.nodeServerSockets = [];
    }

    startServer(){

        this.nodeServer = null;
        try
        {
            var server = io();

            server.on('connection', function(socket){
                socket.emit('request', /* */); // emit an event to the socket
                io.emit('broadcast', /* */); // emit an event to all connected sockets
                socket.on('reply', function(){ /* */ }); // listen to the event
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



}

exports.NodeServer = new NodeServer();