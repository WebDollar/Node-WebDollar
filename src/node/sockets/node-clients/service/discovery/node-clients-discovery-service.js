import consts from 'consts/const_global'
import NodesWaitlist from 'node/lists/waitlist/nodes-waitlist'
import NodesWaitlistObject  from 'node/lists/waitlist/nodes-waitlist-object';
import NodesList from 'node/lists/nodes-list'
import FallBackObject from './fallbacks/fallback-object';
import FallBackNodesList from './fallbacks/fallback_nodes_list';

const axios = require('axios');

class NodeDiscoveryService {

    constructor(){

        console.log("NodeDiscover constructor");

        //in common
        this.fallbackLists = [

            //not working
            "https://www.jasonbase.com/things/RPY5",

        ];

        //CORS problem
        if (!process.env.BROWSER){ // in the browser

            this.fallbackLists.push("https://api.myjson.com/bins/xi1hr");
            this.fallbackLists.push("http://skyhub.me/public/webdollars.json");
            this.fallbackLists.push("http://visionbot.net/webdollars.json");
            this.fallbackLists.push("http://budisteanu.net/webdollars.json");

        }

        for (let i=0; i<this.fallbackLists.length; i++)
            this.fallbackLists[i] = new FallBackObject(this.fallbackLists[i]);

    }

    startDiscovery(){

        this.processFallbackNodes(FallBackNodesList)
        this._discoverFallbackNodes(true);

    }

    async _discoverFallbackNodes(setTimeOut){

        if (NodesList.nodes !== null && NodesList.nodes.length < 5 ){

            for (let i=0; i<this.fallbackLists.length; i++)
                if ( this.fallbackLists[i].checked === false && this.fallbackLists[i].checkLastTimeChecked(consts.NODE_FALLBACK_INTERVAL) )
                {
                    let answer = await this._downloadFallBackList(this.fallbackLists[i]);

                    if (answer !== null)
                        return this.processFallbackNodes(answer)
                }
        }


        if (setTimeOut === true)
            setTimeout(()=>{return this._discoverFallbackNodes(setTimeOut)}, 3000)

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

            fallbackItem.checked = true;

            return response.data;
        }
        catch(Exception){
            console.log("ERROR downloading list: ", url, Exception.toString());
            fallbackItem.errorTrials++;
        }

        return null;
    }

    processFallbackNodes(data){

        try {
            //console.log(data);

            if (typeof data === 'string') data = JSON.parse(data);


            if ((typeof data === 'object') && (data !== null)) {

                let nodes = [];
                let name = '';

                //console.log(data);
                //console.log((data.hasOwnProperty('protocol')));
                //console.log(((data['protocol'] === nodeProtocol)));

                if ((data.hasOwnProperty('protocol')) && (data['protocol'] === consts.NODE_PROTOCOL)) {
                    name = data.name || '';
                    nodes = data.nodes || [];

                    //console.log("FallBack Nodes ",nodes);

                    if (Array.isArray(nodes)) {

                        console.log("NEW NODES", nodes);

                        for (let i = 0; i < nodes.length; i++) {

                            let nodeAddress = '', nodePort = undefined,
                                nodeType = NodesWaitlistObject.NODES_WAITLIST_OBJECT_TYPE.NODE_PEER_TERMINAL_SERVER;

                            if (typeof nodes[i] === "object") {
                                nodeAddress = nodes[i].addr || '';
                                nodePort = nodes[i].port;
                            } else {
                                nodeAddress = nodes[i]; //a simple string Address
                            }

                            NodesWaitlist.addNewNodeToWaitlist(nodeAddress, nodePort, nodeType, 1);
                        }

                    }
                }

                return nodes;
            }
        } catch (exception){
            console.log("error processing fallback list processFallbackNodes", data, exception);
        }


        return null;
    }



}

export default new NodeDiscoveryService();

