import consts from 'consts/const_global'
import NodesWaitlist from 'node/lists/waitlist/nodes-waitlist'
import NodesWaitlistObject  from 'node/lists/waitlist/nodes-waitlist-object';
import NodesList from 'node/lists/nodes-list'
import FallBackObject from './fallbacks/fallback-object';
import FallBackNodesList from './fallbacks/fallback_nodes_list';
import NodesType from "node/lists/types/Nodes-Type"

const axios = require('axios');

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

        this.processFallbackNodes(FallBackNodesList)
        this._discoverFallbackNodes(true);

    }

    async _discoverFallbackNodes(setTimeOut){

        if (NodesList.nodes !== null && NodesList.nodes.length < 5 ){

            for (let i=0; i<this.fallbackLists.length; i++)
                if ( this.fallbackLists[i].checked === false && this.fallbackLists[i].checkLastTimeChecked(consts.SETTINGS.PARAMS.FALLBACK_INTERVAL) )
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
            console.error("ERROR downloading list: ", url, Exception);
            fallbackItem.errorTrials++;
        }

        return null;
    }

    processFallbackNodes(data){

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
                        console.warn("NEW NODES", nodes);

                        let marked = [];

                        for (let i = 0; i < nodes.length; i++) {

                            let pos = Math.floor( Math.random(  ) * nodes.length );

                            while (marked[pos] !== undefined){
                                pos = Math.floor( Math.random(  ) * nodes.length );
                            }

                            let nodeAddress = '', nodePort = undefined,
                                nodeType = NodesType.NODE_TERMINAL;

                            if (typeof nodes[pos] === "object") {
                                nodeAddress = nodes[pos].addr || '';
                                nodePort = nodes[pos].port;
                            } else {
                                nodeAddress = nodes[pos]; //a simple string Address
                            }

                            NodesWaitlist.addNewNodeToWaitlist( nodeAddress, nodePort, nodeType, false, 1, "fallback" );
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

