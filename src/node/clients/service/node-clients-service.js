var NodesClient = require ('../sockets/node-client.js');

class NodeClientsService {

    // clients : [],

    constructor(){
        console.log("NodeServiceClients constructor");
        this.clients = []
    }

    startService(){

    }

    startDiscoverOtherNodes(){
    }

}

exports.serviceClients = new NodeClientsService();