import {NodeClient} from '../../socket/node-client.js';
import {nodeProtocol, nodeFallBackInterval} from '../../../../../consts/const_global.js';
import {NodeClientsService} from '../node-clients-service.js';
import {NodeWaitlist} from '../../../../lists/waitlist/node-waitlist.js';
import {NodeLists} from '../../../../lists/node-lists';

const axios = require('axios');

class NodeDiscoveryService {

    constructor(){

        console.log("NodeDiscover constructor");

        this.axiosInstance = axios.create({
            timeout: 10000,
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            responseType:'json'
        });

    }

    startDiscovery(){

        this.discoverFallbackNodes();

    }

    async discoverFallbackNodes(){

        if (NodeLists.nodes !== null && NodeLists.nodes.length < 5 ){
            await this.downloadFallBackList("http://webdollar.io/public/webdollars.json");
            await this.downloadFallBackList("http://skyhub.me/public/webdollars.json");
            await this.downloadFallBackList("http://visionbot.net/webdollars.json");
            await this.downloadFallBackList("http://budisteanu.net/webdollars.json");
        }

        let that = this;
        setTimeout(function(){return that.discoverFallbackNodes()}, nodeFallBackInterval)

    }

    async downloadFallBackList(address){

        try{

            let response = await this.axiosInstance.get(address);

            let data = response.data;

            //console.log(data);

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

                    if (Array.isArray(nodes) ){

                        //console.log("NEW NODES", nodes);

                        for (let i=0; i<nodes.length; i++) {

                            let nodeAddress = ''; let nodePort = undefined;

                            if (typeof nodes[i] === "object") {
                                nodeAddress = nodes[i].addr || '';
                                nodePort = nodes[i].port || '';
                            } else{
                                nodeAddress = nodes[i];
                            }

                            NodeWaitlist.addNewNodeToWaitlist(nodeAddress, nodePort);
                        }

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

