import NodeClient from 'node/sockets/node-clients/socket/Node-Client'
import NodesList from 'node/lists/Nodes-List'
import NodesWaitlistObject from './Nodes-Waitlist-Object';
import SocketAddress from 'common/sockets/protocol/extend-socket/Socket-Address'
import consts from 'consts/const_global'
import NODES_TYPE from "node/lists/types/Nodes-Type"
import CONNECTION_TYPE from "../types/Connections-Type";
import Blockchain from "main-blockchain/Blockchain";
import AGENT_STATUS from "common/blockchain/interface-blockchain/agents/Agent-Status";
import VersionCheckerHelper from "common/utils/helpers/Version-Checker-Helper"

const EventEmitter = require('events');

class NodesWaitlist {

    constructor(){

        console.log("NodesWaitlist constructor");

        this.NodesWaitlistObject = NodesWaitlistObject;

        this.emitter = new EventEmitter();
        this.emitter.setMaxListeners(100);

        this.waitListFullNodes = [];
        this.waitListLightNodes = [];

        this.started = false;

        this._connectingQueue = [];

        this.MAX_FULLNODE_WAITLIST_CONNECTIONS = 1500;
        this.MAX_LIGHTNODE_WAITLIST_CONNECTIONS = 500;

        this.MAX_ERROR_TRIALS = 100;

        NodesList.emitter.on("nodes-list/disconnected", async (nodesListObject) => {
            await this._desinitializeNode(nodesListObject.socket);
        });

        //interval to delete useless waitlist
        this._deleteUselessWaitlists();

    }


    startConnecting(){

        if (this.started)  return;

        this.started = true;
        this._connectNewNodesWaitlistInterval();

    }

    addNewNodeToWaitlist(addresses, port, type, connected, level, backedBy){

        if ( (typeof addresses === "string" && addresses === '') || (typeof addresses === "object" && (addresses === null || addresses===[])) ) return false;

        //converting to array
        if ( typeof addresses === "string" || !Array.isArray(addresses) ) addresses = [addresses];

        let sckAddresses = [];

        //let's determine the sckAddresses
        for (let i=0; i<addresses.length; i++){

            let sckAddress = SocketAddress.createSocketAddress(addresses[i], port);

            if (backedBy !==  "fallback") {

                let answer = this._searchNodesWaitlist( sckAddress, port, type );;

                if (answer.waitlist!== null) {

                    //already found, let's add a new pushBackedBy
                    answer.waitlist.pushBackedBy(backedBy, connected);

                }
                else sckAddresses.push( sckAddress );

            } else //definitely it is a fallback
                sckAddresses.push( sckAddress );

        }

        // incase this new waitlist is new
        if (sckAddresses.length > 0){

            let waitListObject = new NodesWaitlistObject( sckAddresses, type, level, backedBy , connected);

            let list;

            if (waitListObject.type === NODES_TYPE.NODE_TERMINAL)  list = this.waitListFullNodes;
            else  if (waitListObject.type === NODES_TYPE.NODE_WEB_PEER) list = this.waitListLightNodes;

            //v
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
                if (list[i].sckAddresses[j].matchAddress(sckAddress) )
                    return i;

        return -1;

    }

    _searchNodesWaitlist(address, port, listType ){

        let list = [];

        if (listType === NODES_TYPE.NODE_TERMINAL ) list = this.waitListFullNodes;
        else if ( listType === NODES_TYPE.NODE_WEB_PEER ) list = this.waitListLightNodes;

        let index = this._findNodesWaitlist( address, port, listType );

        if (index === -1) return null;

        return { index: index, waitlist: list[index] };

    }

    /*
        Connect to all nodes
    */
    _connectNewNodesWaitlist(){

        //mobiles usually use mobile internet are they mostly block non 80 blocks
        let isMobile =  VersionCheckerHelper.detectMobile();

        for (let i=0; i < this.waitListFullNodes.length; i++)
            if ( this.waitListFullNodes[i].findBackedBy("fallback") !== null) {

                if (isMobile)
                    if ( this.waitListFullNodes[i].sckAddresses[0].port !== "80" )
                        continue;



                this._tryToConnectNextNode(this.waitListFullNodes[i]);
            }

        // if (NodesList.countNodesByConnectionType(CONNECTION_TYPE.CONNECTION_CLIENT_SOCKET) === 0){
        //
        //     for (let i=0; i < this.waitListFullNodes.length; i++)
        //         if ( this.waitListFullNodes[i].findBackedBy("fallback") !== null)
        //             this._tryToConnectNextNode(this.waitListFullNodes[i]);
        //
        // } else {
        //
        //     for (let i=0; i < this.waitListFullNodes.length; i++)
        //         this._tryToConnectNextNode(this.waitListFullNodes[i]);
        //
        // }

    }

    _connectNewNodesWaitlistInterval(){

        this._connectNewNodesWaitlist();

        setTimeout( this._connectNewNodesWaitlistInterval.bind(this), consts.SETTINGS.PARAMS.WAITLIST.INTERVAL);
    }

    _tryToConnectNextNode(nextWaitListObject){

        if ( process.env.BROWSER && (this._connectingQueue.length + NodesList.countNodesByConnectionType(CONNECTION_TYPE.CONNECTION_CLIENT_SOCKET)) >= consts.SETTINGS.PARAMS.CONNECTIONS.BROWSER.CLIENT.MAXIMUM_CONNECTIONS_IN_BROWSER) return;
        if ( !process.env.BROWSER && (this._connectingQueue.length + NodesList.countNodesByConnectionType(CONNECTION_TYPE.CONNECTION_CLIENT_SOCKET)) >= consts.SETTINGS.PARAMS.CONNECTIONS.TERMINAL.CLIENT.MAXIMUM_CONNECTIONS_IN_TERMINAL) return;

        if (Blockchain.Agent.light && Blockchain.Agent.status === AGENT_STATUS.AGENT_STATUS_SYNCHRONIZED_WEBRTC)
            return;

        //connect only to TERMINAL NODES
        if ( nextWaitListObject.type === NODES_TYPE.NODE_TERMINAL) {

            if (nextWaitListObject.checkLastTimeChecked(consts.SETTINGS.PARAMS.WAITLIST.TRY_RECONNECT_AGAIN) && nextWaitListObject.blocked === false &&
                nextWaitListObject.connecting === false && nextWaitListObject.checkIsConnected() === null) {

                nextWaitListObject.blocked = true;
                this._connectingQueue.push(nextWaitListObject);

                this._connectNowToNewNode(nextWaitListObject).then((connected) => {

                    for (let i=0; i<this._connectingQueue.length; i++)
                        if (this._connectingQueue[i] === nextWaitListObject){
                            this._connectingQueue.splice(i,1);
                        }

                    nextWaitListObject.checked = true;
                    nextWaitListObject.blocked = false;
                    nextWaitListObject.connected = connected;
                    nextWaitListObject.refreshLastTimeChecked();

                });

            }

        }
    }

    async _connectNowToNewNode(nextWaitListObject){

        nextWaitListObject.connecting = true;

        //trying to connect to each sckAddresses

        let index = Math.floor( Math.random() * nextWaitListObject.sckAddresses.length );

        //search if the new protocol was already connected in the past
        let nodeClient = NodesList.searchNodeSocketByAddress(nextWaitListObject.sckAddresses[index], 'all', ["id","uuid"]);
        if (nodeClient !== null) return nodeClient;

        if (nextWaitListObject.socket !== null) nodeClient = nextWaitListObject.socket;
        else nodeClient = new NodeClient();

        try {

            let answer = await nodeClient.connectTo (nextWaitListObject.sckAddresses[index], undefined, nextWaitListObject.level+1);

            if (answer) nextWaitListObject.socketConnected(nodeClient);
            else nextWaitListObject.socketErrorConnected();

            nextWaitListObject.connecting = false;
            return answer;
        }
        catch (Exception) {
            console.log("Error connecting to new protocol waitlist", Exception)
        }

        nextWaitListObject.connecting = false;
        return false;
    }

    /**
     * It will delete useless waitlist WEB_PEER
     * It will delete addresses that tried way too much
     * @returns {boolean}
     */
    _deleteUselessWaitlist(listType){

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

        list.sort(function(a, b) {
            return a.sortingScore()- b.sortingScore();
        });

        for (let i=list-1; i>=0; i--) {

            if ( list[i].errorTrial > this.MAX_ERROR_TRIALS || list[i].type === NODES_TYPE.NODE_WEB_PEER ) {

                this.emitter.emit("waitlist/delete-node", list[i]);
                list.splice(i, 1);

            }

        }

        return false;

    }

    _deleteUselessWaitlists(){

        this._deleteUselessWaitlist( NODES_TYPE.NODE_TERMINAL );
        this._deleteUselessWaitlist( NODES_TYPE.NODE_WEB_PEER );

    }

    removedWaitListElement(address, port, backedBy, listType){

        let list = [];

        if( listType === NODES_TYPE.NODE_TERMINAL)  list = this.waitListFullNodes;
        else if ( listType === NODES_TYPE.NODE_WEB_PEER ) list = this.waitListLightNodes;

        let index = this._findNodesWaitlist(address, port, listType);

        if (index !== -1) {

            list[index].removeBackedBy(backedBy);

            if ( list[index].length === 0) {

                this.emitter.emit("waitlist/delete-node", list[index]);
                list.splice(index, 1);

            }

            return true;
        }

        return false;
    }

    resetWaitlist(listType){

        let list = [];

        if( listType === NODES_TYPE.NODE_TERMINAL)  list = this.waitListFullNodes;
        else if ( listType === NODES_TYPE.NODE_WEB_PEER ) list = this.waitListLightNodes;

        for (let i=0; i<list.length; i++)
            list[i].resetWaitlistNode();

    }

    _desinitializeNode(nodesListObject){

        let socket = nodesListObject.socket;

        this._removeSocket(socket, this.waitListFullNodes);
        this._removeSocket(socket, this.waitListLightNodes);

    }

    _removeSocket(socket, list){

        for (let i=list.length-1; i>=0; i--){

            if (list[i].socket === socket)
                list.splice(i, 1);

        }

    }

}


export default new NodesWaitlist();