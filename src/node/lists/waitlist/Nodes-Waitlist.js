
import NodesList from 'node/lists/Nodes-List'
import NodesWaitlistObject from './Nodes-Waitlist-Object';
import SocketAddress from 'common/sockets/protocol/extend-socket/Socket-Address'
import NODES_TYPE from "node/lists/types/Nodes-Type"
import NodesWaitlist from 'node/lists/waitlist/Nodes-Waitlist'
import DownloadManager from "common/utils/helpers/Download-Manager"
import consts from 'consts/const_global'
import Blockchain from "../../../main-blockchain/Blockchain";

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

        this.MAX_ERROR_TRIALS_FALLBACK = 100;
        this.MAX_ERROR_TRIALS_SIMPLE = 5;

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


    async addNewNodeToWaitlist (addresses, port, type,  connected, level, backedBy, socket){

        if ( (typeof addresses === "string" && addresses === '') || (typeof addresses === "object" && (addresses === null || addresses===[])) ) return false;

        //converting to array
        if ( typeof addresses === "string" || !Array.isArray(addresses) ) addresses = [addresses];


        let sckAddresses = [];

        //let's determine the sckAddresses
        for (let i=0; i<addresses.length; i++){

            try {

                let sckAddress = SocketAddress.createSocketAddress(addresses[i], port);
                if (sckAddress.address.indexOf("192.168") === 0 && !consts.DEBUG ) continue;

                if (process.env.BROWSER && !sckAddress.SSL && consts.SETTINGS.NODE.SSL && !consts.DEBUG )  continue;

                let answer = this._searchNodesWaitlist(sckAddress, port, type);

                if (answer.waitlist === null){
                    if (backedBy === "fallback")
                        sckAddresses.push(sckAddress);
                    else {
                        let response = await DownloadManager.downloadFile(sckAddress.getAddress(true, true), 5000);

                        if (response !== null && response.protocol === consts.SETTINGS.NODE.PROTOCOL) {

                            //search again because i have waited for a promise
                            let answer = this._searchNodesWaitlist(sckAddress, port, type);

                            if (answer.waitlist === null)
                                sckAddresses.push(sckAddress);
                        }


                    }
                }

                if (answer.waitlist !== null) {

                    //already found, let's add a new pushBackedBy
                    answer.waitlist.pushBackedBy(backedBy, connected);

                    if (socket !== undefined) {
                        answer.waitlist.socket = socket;
                        answer.waitlist.connected = true;
                    }

                }
                else{


                }

            } catch (exception){

            }

        }

        // incase this new waitlist is new
        if (sckAddresses.length > 0){

            let waitListObject = new NodesWaitlistObject( sckAddresses, type, level, backedBy , connected, socket );

            let list;

            if (waitListObject.type === NODES_TYPE.NODE_TERMINAL)  list = this.waitListFullNodes;
            else  if (waitListObject.type === NODES_TYPE.NODE_WEB_PEER) list = this.waitListLightNodes;

            if ( socket !== undefined){
                waitListObject.socket = socket;
                waitListObject.connected = true;
            }

            // v
            list.push(waitListObject);

            this.emitter.emit( "waitlist/new-node", waitListObject );
            return waitListObject;

        }
        
        return null;
    }

    _findNodesWaitlist(address, port, listType){

        let list = [];

        let sckAddress = SocketAddress.createSocketAddress( address, port );

        if (listType === NODES_TYPE.NODE_TERMINAL )  list = this.waitListFullNodes;
        else if( listType === NODES_TYPE.NODE_WEB_PEER ) list = this.waitListLightNodes;

        for (let i=0; i<list.length; i++)
            for (let j=0; j<list[i].sckAddresses.length; j++)
                if (list[i].sckAddresses[j].matchAddress(sckAddress, ["ip","uuid", "port"]) ) //match also the port
                    return i;

        return -1;

    }

    _searchNodesWaitlist(address, port, listType ){

        let list = [];

        if (listType === NODES_TYPE.NODE_TERMINAL ) list = this.waitListFullNodes;
        else if ( listType === NODES_TYPE.NODE_WEB_PEER ) list = this.waitListLightNodes;

        let index = this._findNodesWaitlist( address, port, listType );

        if (index === -1) return { index: -1, waitlist: null };

        return { index: index, waitlist: list[index] };

    }



    /**
     * It will delete useless waitlist WEB_PEER
     * It will delete addresses that tried way too much
     * @returns {boolean}
     */
    async _deleteUselessWaitlist(listType){

        let list, max;


        if (listType === NODES_TYPE.NODE_TERMINAL ) {
            list = this.waitListFullNodes;
            max = this.MAX_FULLNODE_WAITLIST_CONNECTIONS;
        }

        if (listType === NODES_TYPE.NODE_WEB_PEER ) {
            list = this.waitListFullNodes;
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

        list.sort(function(a, b) {
            return b.sortingScore() - a.sortingScore();
        });

    }

    _deleteUselessWaitlists(){

        this._deleteUselessWaitlist( NODES_TYPE.NODE_TERMINAL );
        this._deleteUselessWaitlist( NODES_TYPE.NODE_WEB_PEER );

        setTimeout( this._deleteUselessWaitlists.bind(this), 30*1000 + Math.random()*3000 );
    }

    resetWaitlist(listType){

        let list = [];

        if( listType === NODES_TYPE.NODE_TERMINAL)  list = this.waitListFullNodes;
        else if ( listType === NODES_TYPE.NODE_WEB_PEER ) list = this.waitListLightNodes;

        for (let i=0; i<list.length; i++)
            list[i].resetWaitlistNode();

    }

    _initializeNode(socket){

        if (socket.node.protocol === undefined) return;

        let answer = this._searchNodesWaitlist(socket.node.sckAddress, undefined, socket.node.protocol.type);

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

        let answer = this._searchNodesWaitlist(address, undefined, NODES_TYPE.NODE_TERMINAL);
        if ( answer.waitlist !== null) return answer.waitlist.isFallback;

        return false;
    }

}


export default new NodesWaitlist();