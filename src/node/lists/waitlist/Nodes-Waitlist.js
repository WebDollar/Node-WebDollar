
import NodesList from 'node/lists/Nodes-List'
import NodesWaitlistObject from './Nodes-Waitlist-Object';
import SocketAddress from 'common/sockets/protocol/extend-socket/Socket-Address'
import NODE_TYPE from "node/lists/types/Node-Type"
import NodesWaitlist from 'node/lists/waitlist/Nodes-Waitlist'
import DownloadManager from "common/utils/helpers/Download-Manager"
import consts from 'consts/const_global'
import Blockchain from "main-blockchain/Blockchain";
import NODES_CONSENSUS_TYPE from "../types/Node-Consensus-Type";

import GeoLocationLists from 'node/lists/geolocation-lists/GeoLocation-Lists'

const EventEmitter = require('events');

class NodesWaitlist {

    constructor(){

        console.log("NodesWaitlist constructor");

        this.NodesWaitlistObject = NodesWaitlistObject;

        this.emitter = new EventEmitter();
        this.emitter.setMaxListeners(100);

        this.waitListFullNodes = [];
        this.waitListLightNodes = [];

        this.MAX_FULLNODE_WAITLIST_CONNECTIONS = 500;
        this.MAX_LIGHTNODE_WAITLIST_CONNECTIONS = 500;

        this.MAX_ERROR_TRIALS_FALLBACK = 1000;
        this.MAX_ERROR_TRIALS_SIMPLE = 50;

        setTimeout( this._deleteObsoleteFullNodesWaitlist.bind(this), ( 4 + Math.floor( Math.random()*5 )) *60*1000 ); // 10 in 10 minutes

    }

    initializeWaitlist(){

        NodesList.emitter.on("nodes-list/connected", async (nodesListObject) => {
            await this._initializeNode(nodesListObject.socket);
        });

        NodesList.emitter.on("nodes-list/disconnected", async (nodesListObject) => {
            await this._desinitializeNode(nodesListObject.socket);
        });

        //interval to delete useless waitlist and resort scores

        setTimeout( this._deleteUselessWaitlists.bind(this), 20*1000 + Math.random()*3000 );

    }


    async addNewNodeToWaitlist (addresses, port, nodeType, nodeConsensusType,  connected, level, backedBy, socket, forceInsertingWaitlist=false){

        if ( (typeof addresses === "string" && addresses === '') || (typeof addresses === "object" && (addresses === null || addresses===[])) ) return {result:false, waitlist: null};

        //converting to array
        if ( typeof addresses === "string" || !Array.isArray(addresses) ) addresses = [addresses];


        //avoid connecting to other nodes
        if ( Blockchain.MinerPoolManagement !== undefined && Blockchain.MinerPoolManagement.minerPoolStarted && nodeConsensusType !== NODES_CONSENSUS_TYPE.NODE_CONSENSUS_SERVER && nodeType !== NODE_TYPE.NODE_WEB_PEER)
            return {result:false, waitlist: null};



        let sckAddresses = [];
        let waitListFound = null;

        //let's determine the sckAddresses
        for (let i=0; i<addresses.length; i++){

            try {

                let sckAddress = SocketAddress.createSocketAddress(addresses[i], port);
                if (sckAddress.address.indexOf("192.168") === 0 && !consts.DEBUG ) continue;

                //check blocked addresses
                for (let i=0; i<consts.SETTINGS.PARAMS.WAITLIST.BLOCKED_NODES.length; i++)
                    if (sckAddress.address.indexOf(consts.SETTINGS.PARAMS.WAITLIST.BLOCKED_NODES[i])) continue;

                //it if is a fallback, maybe it requires SSL
                if ( nodeType === NODE_TYPE.NODE_TERMINAL && process.env.BROWSER && !sckAddress.SSL && consts.SETTINGS.NODE.SSL && !consts.DEBUG )  continue;

                let answer = this._searchNodesWaitlist(sckAddress, port, nodeType);

                if (answer.waitlist === null){
                    if (backedBy === "fallback")
                        sckAddresses.push(sckAddress);
                    else {

                        let response;

                        if ( !forceInsertingWaitlist && nodeType === NODE_TYPE.NODE_TERMINAL)
                            response = await DownloadManager.downloadFile(sckAddress.getAddress(true, true), 5000);

                        if ( forceInsertingWaitlist || nodeType === NODE_TYPE.NODE_WEB_PEER || ( response && response.protocol === consts.SETTINGS.NODE.PROTOCOL && response.version >= Blockchain.versionCompatibility) ) {

                            //search again because i have waited for a promise
                            let answer = this._searchNodesWaitlist(sckAddress, port, nodeType);

                            if ( !answer.waitlist )
                                sckAddresses.push(sckAddress);
                            else
                                waitListFound = answer.waitlist;
                        }


                    }
                }

                if (answer.waitlist ) {

                    //already found, let's add a new pushBackedBy
                    answer.waitlist.pushBackedBy(backedBy, connected);

                    if (socket !== undefined)
                        answer.waitlist.socketConnected(socket);

                    waitListFound = answer.waitlist;

                }
                else{


                }

            } catch (exception){

            }

        }

        // incase this new waitlist is new
        if (sckAddresses.length > 0){

            let waitListObject = new NodesWaitlistObject( sckAddresses, nodeType, nodeConsensusType, level, backedBy , connected, socket );
            GeoLocationLists._includeAddress(sckAddresses[0]);

            let list;

            if (waitListObject.nodeType === NODE_TYPE.NODE_TERMINAL)  list = this.waitListFullNodes;
            else  if (waitListObject.nodeType === NODE_TYPE.NODE_WEB_PEER) list = this.waitListLightNodes;

            if ( socket !== undefined){
                waitListObject.socket = socket;
                waitListObject.connected = true;
            }

            // v
            list.push(waitListObject);

            this.emitter.emit( "waitlist/new-node", waitListObject );
            return {result: true, waitlist: waitListObject};

        } else
            return {result:false, waitlist: waitListFound};
    }

    _findNodesWaitlist(address, port, listType){

        let list = [];

        let sckAddress = SocketAddress.createSocketAddress( address, port );

        if (listType === NODE_TYPE.NODE_TERMINAL )  list = this.waitListFullNodes;
        else if( listType === NODE_TYPE.NODE_WEB_PEER ) list = this.waitListLightNodes;

        for (let i=0; i<list.length; i++)
            for (let j=0; j<list[i].sckAddresses.length; j++)
                if (list[i].sckAddresses[j].matchAddress( sckAddress, ["ip","uuid", "port"]) ) //match also the port
                    return i;

        return -1;

    }

    _searchNodesWaitlist(address, port, listType ){

        let list = [];

        if (listType === NODE_TYPE.NODE_TERMINAL ) list = this.waitListFullNodes;
        else if ( listType === NODE_TYPE.NODE_WEB_PEER ) list = this.waitListLightNodes;

        let index = this._findNodesWaitlist( address, port, listType );

        if (index === -1) return { index: -1, waitlist: null };

        return { index: index, waitlist: list[index] };

    }

    deleteWaitlistByConsensusNode(nodeConsensusType){

        for (let i=this.waitListFullNodes.length-1; i>=0; i--)
            if (this.waitListFullNodes[i].nodeConsensusType === nodeConsensusType)
                this.waitListFullNodes.splice(i,1);

    }
    async _deleteObsoleteFullNodesWaitlist(){

        for (let i=this.waitListFullNodes.length-1; i>=0; i--)
            if (!this.waitListFullNodes[i].isFallback) {

                try {

                    if ( (Blockchain.MinerPoolManagement.minerPoolStarted || Blockchain.MinerPoolManagement.poolStarted ) && [ NODES_CONSENSUS_TYPE.NODE_CONSENSUS_SERVER, NODES_CONSENSUS_TYPE.NODE_CONSENSUS_POOL].indexOf( this.waitListFullNodes[i].nodeConsensusType ) >= 0) continue;

                    let response = await DownloadManager.downloadFile(this.waitListFullNodes[i].sckAddresses[0].getAddress(true, true), 10000);

                    if (response !== null && response.protocol === consts.SETTINGS.NODE.PROTOCOL && response.version >= Blockchain.versionCompatibility) {
                        this.waitListFullNodes[i].failsChecking = 0;
                        continue;
                    }
                    else {
                        this.waitListFullNodes[i].failsChecking++;

                        if (this.waitListFullNodes[i].failsChecking >= 5)
                            this.waitListFullNodes.splice(i, 1);

                    }

                } catch (exception){

                }

                await Blockchain.blockchain.sleep( 500 + Math.floor( Math.random()*2000) );
            }

        setTimeout( this._deleteObsoleteFullNodesWaitlist.bind(this), ( 4 + Math.floor( Math.random()*5 )) *60*1000 ); // 10 in 10 minutes

    }

    /**
     * It will delete useless waitlist WEB_PEER
     * It will delete addresses that tried way too much
     * @returns {boolean}
     */
    async _deleteUselessWaitlist(listType){

        
        let list, max;


        if (listType === NODE_TYPE.NODE_TERMINAL ) {
            list = this.waitListFullNodes;
            max = this.MAX_FULLNODE_WAITLIST_CONNECTIONS;
        } else
        if (listType === NODE_TYPE.NODE_WEB_PEER ) {
            list = this.waitListLightNodes;
            max = this.MAX_LIGHTNODE_WAITLIST_CONNECTIONS;
        }

        //sorting by formula connectedBy

        for (let i=list.length-1; i>=0; i--)
            if (  ( list[i].isFallback && list[i].errorTrials > this.MAX_ERROR_TRIALS_FALLBACK ) ||
                  ( !list[i].isFallback && list[i].errorTrials > this.MAX_ERROR_TRIALS_SIMPLE)) {

                this.emitter.emit("waitlist/delete-node", list[i]);
                list.splice(i, 1);

            }

        await Blockchain.blockchain.sleep(20);

        this._sortList(list);

        await Blockchain.blockchain.sleep(50);

        //make sure the list has a maximum length
        if (list.length > max){
            list.splice(max);
        }

        return false;

    }

    _sortList(list){

        for (let i=0; i<list.length; i++){
            list[i].score = list[i].sortingScore();
        }

        list.sort(function(a, b) {
            return b.score - a.score;
        });

    }

    _deleteUselessWaitlists(){

        this._deleteUselessWaitlist( NODE_TYPE.NODE_TERMINAL );
        this._deleteUselessWaitlist( NODE_TYPE.NODE_WEB_PEER );

        setTimeout( this._deleteUselessWaitlists.bind(this), 30*1000 + Math.random()*3000 );
    }

    resetWaitlist(listType){

        let list = [];

        if( listType === NODE_TYPE.NODE_TERMINAL)  list = this.waitListFullNodes;
        else if ( listType === NODE_TYPE.NODE_WEB_PEER ) list = this.waitListLightNodes;

        for (let i=0; i<list.length; i++)
            list[i].resetWaitlistNode();

    }

    _initializeNode(socket){

        if (socket.node.protocol === undefined) return;

        let answer = this._searchNodesWaitlist(socket.node.sckAddress, undefined, socket.node.protocol.nodeType);

        if ( answer.waitlist !== null ){

            answer.socket = socket;
            answer.connected = true;

        }

    }

    _desinitializeNode(socket){

        this._removeSocket(socket, this.waitListFullNodes);
        this._removeSocket(socket, this.waitListLightNodes);

    }

    _removeSocket(socket, list){

        for (let i=list.length-1; i>=0; i--)

            if (list[i].socket === socket) {
                list[i].connected = false;
                list[i].socket = undefined;
            }


    }

    isAddressFallback(address){

        let answer = this._searchNodesWaitlist(address, undefined, NODE_TYPE.NODE_TERMINAL);
        if ( answer.waitlist !== null) return answer.waitlist.isFallback;

        return false;
    }

    getJSONList(listType, fallback){

        let list = [];

        if (listType === NODE_TYPE.NODE_TERMINAL ) list = this.waitListFullNodes;
        else if ( listType === NODE_TYPE.NODE_WEB_PEER ) list = this.waitListLightNodes;

        let answer = [];

        for (let i=0; i<list.length; i++){

            if (fallback === undefined || (fallback === list[i].isFallback))
                answer.push(list[i].toJSON() );

        }

        return answer;

    }

}


export default new NodesWaitlist();