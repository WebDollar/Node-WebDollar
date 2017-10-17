var NodesClient = require ('../sockets/node-client.js');

class NodeClientsService {

    // clients : [],

    constructor(){
        console.log("NodeServiceClients constructor");
        this.clients = []
    }

    startService(){


        var that = this;
        setInterval(function(){return that.discoverOtherNodes()}, 5000);

    }

    discoverOtherNodes(){

        console.log("DISCOVERING OTHER NODES");

    }

}

exports.serviceClients = new NodeClientsService();