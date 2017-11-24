import consts from 'consts/const_global'
import NodesWaitlist from 'node/lists/waitlist/nodes-waitlist'
import NodesList from 'node/lists/nodes-list'
import {FallBackObject} from './fallback-object';

const axios = require('axios');

class NodeDiscoveryService {

    constructor(){

        console.log("NodeDiscover constructor");

        this.fallbackLists = [

            new FallBackObject("https://www.jasonbase.com/things/RPY5"),

            new FallBackObject("https://api.myjson.com/bins/xi1hr"),
            new FallBackObject("http://skyhub.me/public/webdollars.json"),
            new FallBackObject("http://visionbot.net/webdollars.json"),
            new FallBackObject("http://budisteanu.net/webdollars.json"),

        ];

    }

    startDiscovery(){

        this._discoverFallbackNodes();

    }

    async _discoverFallbackNodes(){

        if (NodesList.nodes !== null && NodesList.nodes.length < 5 ){

            for (let i=0; i<this.fallbackLists.length; i++)
                if ( this.fallbackLists[i].checked === false && this.fallbackLists[i].checkLastTimeChecked(consts.NODE_FALLBACK_INTERVAL) )
                {
                    await this._downloadFallBackList(this.fallbackLists[i]);
                }
        }

        setTimeout(()=>{return this._discoverFallbackNodes()}, 3000)

    }

    async _downloadFallBackList(fallbackItem){

        fallbackItem.refreshLastTimeChecked();
        let url = fallbackItem.url;

        try{

            let response = await axios({
                method:'get',
                timeout: 10000,
                withCredentials: true,
                url: url,
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                responseType: 'json',
            });

            let data = response.data;

            //console.log(data);

            if (typeof data === 'string') data = JSON.parse(data);


            if ((typeof data === 'object') && (data !== null)){

                fallbackItem.checked = true;

                let nodes =  [];
                let name = '';

                //console.log(data);
                //console.log((data.hasOwnProperty('protocol')));
                //console.log(((data['protocol'] === nodeProtocol)));

                if ((data.hasOwnProperty('protocol'))&&(data['protocol'] === consts.NODE_PROTOCOL)){
                    name = data.name||'';
                    nodes = data.nodes||[];

                    //console.log("FallBack Nodes ",nodes);

                    if (Array.isArray(nodes) ){

                        //console.log("NEW NODES", nodes);

                        for (let i=0; i<nodes.length; i++) {

                            let nodeAddress = '', nodePort = undefined;

                            if (typeof nodes[i] === "object") {
                                nodeAddress = nodes[i].addr || '';
                                nodePort = nodes[i].port;
                            } else{
                                nodeAddress = nodes[i]; //a simple string Address
                            }

                            if ( (typeof nodeAddress === "string" && nodeAddress !== '') || ( typeof nodeAddress === "object" && Array.isArray(nodeAddress)) )
                                NodesWaitlist.addNewNodeToWaitlist(nodeAddress, nodePort);
                        }

                    }
                }

                return nodes;
            }
        }
        catch(Exception){
            console.log("ERROR downloading list: ", url, Exception.toString());
            fallbackItem.errorTrials++;

            return null;
        }
    }



}

export default new NodeDiscoveryService();

