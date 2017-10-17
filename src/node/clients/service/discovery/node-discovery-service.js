import {NodeClient} from '../../sockets/node-client.js';
const axios = require('axios');

class NodeDiscoveryService {

    // nodeClientsService = null

    constructor(nodeClientsService){

        console.log("NodeDiscover constructor");

        this.nodeClientsService = nodeClientsService;
    }

    startDiscovery(){

        this.discoverNewNodes();

    }

    discoverNewNodes(){
        console.log("DISCOVERING OTHER NODES");

        this.downloadList("http://skyhub.me/webdollars.json");
        this.downloadList("http://visionbot.net/webdollars.json");
        this.downloadList("http://budisteanu.net/webdollars.json");

        if ((this.nodeClientsService !== null)&&(this.nodeClientsService.nodeClients !== null)&&(this.nodeClientsService.nodeClients.length < 5)){
            let that = this;
            setTimeout(function(){return that.discoverNewNodes()}, 5000)
        }
    }

    downloadList(address){

        axios.get(address).then(response => {
                console.log(response.data);
            })
            .catch(error => {
                console.log(error);
            });
    }



}

exports.NodeDiscoveryService = NodeDiscoveryService;

