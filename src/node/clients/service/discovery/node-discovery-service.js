import {NodeClient} from '../../sockets/node-client.js';
import {nodeProtocol, nodeFallBackInterval} from '../../../../consts/const_global.js';
import {NodeClientsService} from './../node-clients-service.js';
import {NodeClientsWaitlist} from '../../../lists/waitlist/node-clients-waitlist.js';

const axios = require('axios');

class NodeDiscoveryService {

    // nodeClientsService = null

    constructor(){

        console.log("NodeDiscover constructor");

    }

    startDiscovery(){

        this.discoverFallbackNodes();

    }

    async discoverFallbackNodes(){
        //console.log("DISCOVERING OTHER NODES");

        await this.downloadFallBackList("http://skyhub.me/public/webdollars.json");
        await this.downloadFallBackList("http://visionbot.net/webdollars.json");
        await this.downloadFallBackList("http://budisteanu.net/webdollars.json");

        if ((NodeClientsService.nodeClients !== null)&&(NodeClientsService.nodeClients.length < 5)){
            let that = this;
            setTimeout(function(){return that.discoverFallbackNodes()}, nodeFallBackInterval)
        }
    }

    async downloadFallBackList(address){

        try{
            let response = await axios.get(address);

            let data = response.data;

            if (typeof data === 'string') data = JSON.parse(data);

            //console.log(data, typeof data);

            if ((typeof data === 'object') && (data !== null)){

                let nodes =  [];
                let name = '';

                //console.log(data);
                //console.log((data.hasOwnProperty('protocol')));
                //console.log(((data['protocol'] === nodeProtocol)));

                if ((data.hasOwnProperty('protocol'))&&(data['protocol'] === nodeProtocol)){
                    name = data.name||'';
                    nodes = data.nodes||[];

                    //console.log("FallBack Nodes ",nodes);

                    if ((nodes !== null)&&(Array.isArray(nodes))){

                        //console.log("NEW NODES", nodes);

                        for (let i=0; i<nodes.length; i++)
                            NodeClientsWaitlist.addNewNodeToWaitlist(nodes[i]);

                    }
                }

                return nodes;
            }
        }
        catch(Exception){
            console.log("ERROR downloading list: ", address, Exception.toString());
            return null;
        }
    }



}

exports.NodeDiscoveryService = new NodeDiscoveryService();

