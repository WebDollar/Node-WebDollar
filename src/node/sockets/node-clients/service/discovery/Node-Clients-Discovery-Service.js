import consts from 'consts/const_global'
import NodesWaitlist from 'node/lists/waitlist/Nodes-Waitlist'
import NodesWaitlistObject  from 'node/lists/waitlist/Nodes-Waitlist-Object';
import NodesList from 'node/lists/Nodes-List'
import FallBackObject from './fallbacks/fallback-object';
import FallBackNodesList from './fallbacks/fallback_nodes_list';
import NODE_TYPE from "node/lists/types/Node-Type"
import NODES_CONSENSUS_TYPE from "node/lists/types/Node-Consensus-Type";
var rp = require('request-promise');

class NodeDiscoveryService {

    constructor(){

        console.log("NodeDiscover constructor");

        //in common
        this.fallbackLists = [

            //working in both
        //    "https://www.jasonbase.com/things/RPY5",

        ];

        // //CORS problem
        // if (!process.env.BROWSER){ // in the browser
        //
        //     this.fallbackLists.push("https://api.myjson.com/bins/xi1hr");
        //     this.fallbackLists.push("https://skyhub.me/public/webdollars.json");
        //     this.fallbackLists.push("https://visionbot.net/webdollars.json");
        //     this.fallbackLists.push("https://budisteanu.net/webdollars.json");
        //
        // }

        for (let i=0; i<this.fallbackLists.length; i++)
            this.fallbackLists[i] = new FallBackObject(this.fallbackLists[i]);

    }

    startDiscovery(){

        this.processFallbackNodes(FallBackNodesList);
        this._discoverFallbackNodes(true);

    }

    async _discoverFallbackNodes(setTimeOut){

        if (NodesList.nodes !== null && NodesList.nodes.length < 5 ){

            for (let i=0; i<this.fallbackLists.length; i++)
                if ( this.fallbackLists[i].checked === false && this.fallbackLists[i].checkLastTimeChecked(consts.SETTINGS.PARAMS.FALLBACK_INTERVAL) )
                {
                    let answer = await this._downloadFallBackList(this.fallbackLists[i]);

                    if (answer !== null)
                        return await this.processFallbackNodes(answer)
                }
        }


        if (setTimeOut === true)
            setTimeout(()=>{return this._discoverFallbackNodes(setTimeOut)}, 3000)

    }

    async _downloadFallBackList(fallbackItem){

        fallbackItem.refreshLastTimeChecked();
        let url = fallbackItem.url;

        try{

            let response = await rp( {
                method:'get',
                timeout: 10000,
                uri: url,
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'User-Agent': 'Request-Promise'
                },
                json: true, // Automatically parses the JSON string in the response
            });

            fallbackItem.checked = true;

            return response.data;
        }
        catch(Exception){
            console.error("ERROR downloading list: ", url, Exception);
            fallbackItem.errorTrials++;
        }

        return null;
    }

    async processFallbackNodes(data){

        try {

            //console.log(data);

            if (typeof data === 'string') {
                try {
                    data = JSON.parse(data);
                } catch (exception){
                    console.error("Error processFallbackNodes String", data, exception);
                }
            }


            if ((typeof data === 'object') && (data !== null)) {

                let nodes = [];
                let name = '';

                if ((data.hasOwnProperty('protocol')) && (data['protocol'] === consts.SETTINGS.NODE.PROTOCOL)) {
                    name = data.name || '';
                    nodes = data.nodes || [];

                    //console.log("FallBack Nodes ",nodes);
                    if (Array.isArray(nodes)) {

                        //let's shuffle
                        //console.warn("Signal nodes", nodes);

                        let marked = [];

                        for (let i = 0; i < nodes.length; i++) {

                            let pos = Math.floor( Math.random(  ) * nodes.length );

                            while (marked[pos] !== undefined)
                                pos = Math.floor( Math.random(  ) * nodes.length );

                            marked[pos] = true;

                            let nodeAddress = '', nodePort = undefined,
                                nodeType = NODE_TYPE.NODE_TERMINAL;

                            if (typeof nodes[pos] === "object") {
                                nodeAddress = nodes[pos].addr || '';
                                nodePort = nodes[pos].port;
                            } else {
                                nodeAddress = nodes[pos]; //a simple string Address
                            }

                            await NodesWaitlist.addNewNodeToWaitlist( nodeAddress, nodePort, nodeType, NODES_CONSENSUS_TYPE.NODE_CONSENSUS_PEER, false, 1, "fallback" );
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

