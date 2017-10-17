import {NodeClient} from '../../sockets/node-client.js';
import {nodeProtocol} from '../../../../consts/const_global.js';

const axios = require('axios');

class NodeDiscoveryService {

    // nodeClientsService = null

    constructor(nodeClientsService){

        console.log("NodeDiscover constructor");

        this.nodeClientsService = nodeClientsService;
    }

    startDiscovery(){

        this.discoverFallbackNodes();

    }

    discoverFallbackNodes(){
        console.log("DISCOVERING OTHER NODES");

        this.downloadFallBackList("http://skyhub.me/webdollars.json");
        this.downloadFallBackList("http://visionbot.net/webdollars.json");
        this.downloadFallBackList("http://budisteanu.net/webdollars.json");

        if ((this.nodeClientsService !== null)&&(this.nodeClientsService.nodeClients !== null)&&(this.nodeClientsService.nodeClients.length < 5)){
            let that = this;
            setTimeout(function(){return that.discoverFallbackNodes()}, 5000)
        }
    }

    downloadFallBackList(address){

        axios.get(address).then(response => {
                console.log(response.data);

                let data = response.data;
                if (data.hasOwnProperty('protocol')&&(data['protocol'] === nodeProtocol)){
                    let name = data.name||'';
                    let nodes = data.nodes||[];

                    if ((nodes !== null)&&(Array.isArray(nodes))){



                    }
                }

            })
            .catch(error => {
                console.log("ERROR downloading list", error.toString());
            });
    }



}

exports.NodeDiscoveryService = NodeDiscoveryService;

