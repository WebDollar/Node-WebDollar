import NodeClient from 'node/sockets/node_clients/socket/node-client'
import NodesList from 'node/lists/nodes-list'
import { NodesWaitlistObject, NODES_WAITLIST_OBJECT_TYPE } from './nodes-waitlist-object';
import SocketAddress from 'common/sockets/socket-address'
import consts from 'consts/const_global'
const EventEmitter = require('events');

class NodesWaitlist {

    /*
        waitlist = []     //Addresses where it should connect too
        events = []
        stated = false;
    */

    constructor(){
        console.log("NodesWaitlist constructor");

        this.NODES_WAITLIST_OBJECT_TYPE = NODES_WAITLIST_OBJECT_TYPE;
        this.NodesWaitlistObject = NodesWaitlistObject;

        this.emitter = new EventEmitter();

        this.waitlist = [];
        this.events = [];
        this.started = false;

        this.MAX_CONNECTIONS = 5000;
        this.MAX_ERROR_TRIALS = 100;
    }


    async startConnecting(){

        if (this.started === false) {
            this.started = true;
            this._connectNewNodesWaitlist(true);
        }

    }

    addNewNodeToWaitlist(addresses, port, type, level){

        // addresses = "127.0.0.1";

        if ( (typeof addresses === "string" && addresses === '') || (typeof addresses === "object" && (addresses === null || addresses===[]))) return false;

        if (typeof addresses === "string" || !Array.isArray(addresses)) addresses = [addresses];

        console.log("addresses", addresses);

        let sckAddresses = [];
        for (let i=0; i<addresses.length; i++){

            let sckAddress = SocketAddress.createSocketAddress(addresses[i], port);

            //console.log("addNewNodeToWaitlist2", addresses[i], this._searchNodesWaitlist(sckAddress));

            if ( this._searchNodesWaitlist(sckAddress) === null){
                sckAddresses.push(sckAddress);
            }

        }

        if (sckAddresses.length > 0){

            let waitListObject = new NodesWaitlistObject(sckAddresses, type, level);
            this.waitlist.push(waitListObject);

            this._tryToConnectNextNode(waitListObject);

            this.emitter.emit("waitlist/new-node", waitListObject);
            return waitListObject;
        }
        
        return null;
    }

    _searchNodesWaitlist(address, port){

        let sckAddress = SocketAddress.createSocketAddress( address, port );

        for (let i=0; i<this.waitlist.length; i++)
            for (let j=0; j<this.waitlist[i].sckAddresses.length; j++)
                if (this.waitlist[i].sckAddresses[j].matchAddress(sckAddress) )
                    return this.waitlist[i];

        return null;
    }

    /*
        Connect to all nodes
    */
    _connectNewNodesWaitlist(setTimeOut){

        console.log("Waitlist length", this.waitlist.length);
        for (let i=0; i<this.waitlist.length; i++)
            console.log(this.waitlist[i].toString())

        this._deleteUselessWaitlist();

        for (let i=0; i < this.waitlist.length; i++){

            let nextNode = this.waitlist[i];

            this._tryToConnectNextNode(nextNode);

        }


        if (setTimeOut === true)
            setTimeout(()=>{ return this._connectNewNodesWaitlist( true ) }, consts.NODES_WAITLIST_INTERVAL);
    }

    _tryToConnectNextNode(nextWaitListObject){

        //connect only to TERMINAL NODES
        if (nextWaitListObject.type === NODES_WAITLIST_OBJECT_TYPE.NODE_PEER_TERMINAL_SERVER) {

            if (nextWaitListObject.checkLastTimeChecked(consts.NODES_WAITLIST_TRY_RECONNECT_AGAIN) && nextWaitListObject.blocked === false &&
                nextWaitListObject.connecting === false && nextWaitListObject.checkIsConnected() === null) {

                nextWaitListObject.blocked = true;

                //console.log("connectNewNodesWaitlist ", nextNode.sckAddresses.toString() );

                this._connectNowToNewNode(nextWaitListObject).then((connected) => {
                    nextWaitListObject.checked = true;
                    nextWaitListObject.blocked = false;
                    nextWaitListObject.connected = connected;
                    nextWaitListObject.refreshLastTimeChecked();
                });

            }
        }
    }

    async _connectNowToNewNode(nextNode){

        nextNode.connecting = true;

        //console.log("nextNode.sckAddresses", nextNode.sckAddresses);

        //trying to connect to each sckAddresses
        for (let i=0; i<nextNode.sckAddresses.length; i++) {

            //search if the new protocol was already connected in the past
            let nodeClient = NodesList.searchNodeSocketByAddress(nextNode.sckAddresses[i], 'all', ["id","uuid"]);
            if (nodeClient !== null) return nodeClient;

            if (nextNode.socket !== null) nodeClient = nextNode.socket;
            else nodeClient = new NodeClient();

            try {
                let answer = await nodeClient.connectTo(nextNode.sckAddresses[i]);

                if (answer) nextNode.socketConnected(nodeClient);
                else nextNode.socketErrorConnected();

                nextNode.connecting = false;
                return answer;
            }
            catch (Exception) {
                console.log("Error connecting to new protocol waitlist", Exception.toString())
            }

        }
        nextNode.connecting = false;
        return false;
    }

    /**
     * It will delete useless waitlist WEB_RTC_PEERs
     * It will delete addresses that tried way too much
     * @returns {boolean}
     */
    _deleteUselessWaitlist(){

        if (this.waitlist.length < this.MAX_CONNECTIONS)
            return false;

        for (let i=this.waitlist.length-1; i>=0; i--) {

            if (this.waitlist[i].errorTrial > this.MAX_ERROR_TRIALS ||
                this.waitlist[i].type === NODES_WAITLIST_OBJECT_TYPE.WEB_RTC_PEER) {
                this.emitter.emit("waitlist/delete-node", this.waitlist[i]);
                this.waitlist.splice(i, 1);
            }

        }

    }



}


export default new NodesWaitlist();