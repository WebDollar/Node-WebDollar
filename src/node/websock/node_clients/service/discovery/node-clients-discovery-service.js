import {NodeClient} from '../../socket/node-client.js';
import {nodeProtocol, nodeFallBackInterval} from '../../../../../consts/const_global.js';
import {NodeClientsService} from '../node-clients-service.js';
import {NodeWaitlist} from '../../../../lists/waitlist/node-waitlist.js';
import {NodeLists} from '../../../../lists/node-lists';

const axios = require('axios');

class NodeDiscoveryService {

    constructor(){

        console.log("NodeDiscover constructor");

        this.fallbackLists = [
            {"url":"https://www.jasonbase.com/things/E1p1"},


            // {"url":"https://api.myjson.com/bins/xi1hr"},
            // {"url":"http://skyhub.me/public/webdollars.json"}, {"url":"http://visionbot.net/webdollars.json"}, {"url":"http://budisteanu.net/webdollars.json"}
        ];

    }

    startDiscovery(){

        this.discoverFallbackNodes();

    }

    async discoverFallbackNodes(){

        if (NodeLists.nodes !== null && NodeLists.nodes.length < 5 ){

            for (let i=0; i<this.fallbackLists.length; i++)
                if (typeof this.fallbackLists[i].checked === 'undefined')
                {
                    await this._downloadFallBackList(i);
                }
            //await this.downloadFallBackList("https://api.myjson.com/bins/xi1hr");
            //await this.downloadFallBackList("https://www.jasonbase.com/things/E1p1");
            // await this.downloadFallBackList("http://skyhub.me/public/webdollars.json");
            // await this.downloadFallBackList("http://visionbot.net/webdollars.json");
            // await this.downloadFallBackList("http://budisteanu.net/webdollars.json");
        }

        setTimeout(()=>{return this.discoverFallbackNodes()}, nodeFallBackInterval)

    }

    async _downloadFallBackList(fallbackListsIndex){

        if (fallbackListsIndex >= this.fallbackLists.length ) return false;

        let address = this.fallbackLists[fallbackListsIndex].url;

        try{

            let response = await axios({
                method:'get',
                timeout: 10000,
                withCredentials: true,
                url: address,
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                responseType: 'json',
            });

            let data = response.data;

            console.log(data);

            if (typeof data === 'string') data = JSON.parse(data);

            //console.log(data, typeof data);

            if ((typeof data === 'object') && (data !== null)){

                this.fallbackLists[fallbackListsIndex].checked = true;

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

