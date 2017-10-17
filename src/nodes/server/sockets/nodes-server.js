var io = require('socket.io');

class NodesServer {

    // server : null,

    constructor(){

        console.log("NodeServer constructor");
        this.server = null;
    }

    startServer(){

        try
        {
            var server = io();

            server.on('connection', function(socket){
                socket.emit('request', /* */); // emit an event to the socket
                io.emit('broadcast', /* */); // emit an event to all connected sockets
                socket.on('reply', function(){ /* */ }); // listen to the event
            });

            server.listen(8320);

            this.server = server;
        }
        catch(Exception){
            console.log("Error Starting Node Server ", Exception.toString());
            return false;
        }

        console.log("Node Server Started");
        return true;
    }

    startDiscoverOtherNodes(){



    }

}

exports.server = new NodesServer();