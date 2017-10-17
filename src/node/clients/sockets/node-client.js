var ioClient = require('socket.io-client');

class NodeClient {

    // client : null,

    constructor(){

        console.log("NodeClient constructor");
        this.client = null;
    }

    connectTo(address){

        try
        {
            var client = ioClient(address);

            client.on('connection', function(){
                console.log("Client connected");
            });

            client.on('disconnect', function(){
                console.log("Client disconnected");
            });

            this.client = client;
        }
        catch(Exception){
            console.log("Error Connecting Node to ",address);
            console.log(" Exception", Exception.toString());
            return false;
        }

        return true;
    }

    startDiscoverOtherNodes(){

    }

}

exports.client =  NodeClient;