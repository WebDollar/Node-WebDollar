import {NodeClient} from '../../sockets/node-client.js';
import {nodeProtocol, nodeFallBackInterval} from '../../../../consts/const_global.js';

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

    async discoverFallbackNodes(){
        console.log("DISCOVERING OTHER NODES");

        await this.downloadFallBackList("http://skyhub.me/public/webdollars.json");
        await this.downloadFallBackList("http://visionbot.net/webdollars.json");
        await this.downloadFallBackList("http://budisteanu.net/webdollars.json");

        if ((this.nodeClientsService !== null)&&(this.nodeClientsService.nodeClients !== null)&&(this.nodeClientsService.nodeClients.length < 5)){
            let that = this;
            setTimeout(function(){return that.discoverFallbackNodes()}, nodeFallBackInterval)
        }
    }

    async downloadFallBackList(address){

        try{
            let response = await axios.get(address);
            console.log(response.data);

            if (response.type === 'json'){

                let nodes =  [];
                let name = '';

                let data = response.data;
                if (data.hasOwnProperty('protocol')&&(data['protocol'] === nodeProtocol)){
                    name = data.name||'';
                    nodes = data.nodes||[];

                    if ((nodes !== null)&&(Array.isArray(nodes))){

                        console.log("NEW NODES", nodes);

                        for (let i=0; i<nodes.length; i++)
                            this.nodeClientsService.connectNewNode(nodes[i]);

                    }
                }

                return nodes;
            }
        }
        catch(Exception){
            console.log("ERROR downloading list: ", address);
            console.log(Exception.toString());
            return null;
        }
    }



}

exports.NodeDiscoveryService = NodeDiscoveryService;

