var NodesClient = require ('../sockets/nodes-client.js');

class NodesClientsService {

    // clients : [],

    constructor(){

        console.log("NodeServiceClients constructor");
        this.clients = []
    }

    startDiscoverOtherNodes(){
    }

}

exports.serviceClients = new NodesClientsService();