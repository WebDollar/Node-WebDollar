import NodeClient from 'node/sockets/node-clients/socket/Node-Client'
import NodesList from 'node/lists/nodes-list'
import NodesWaitlistObject from './nodes-waitlist-object';
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

        this.NODES_WAITLIST_OBJECT_TYPE = NodesWaitlistObject.NODES_WAITLIST_OBJECT_TYPE;
        this.NodesWaitlistObject = NodesWaitlistObject;

        this.emitter = new EventEmitter();
        this.emitter.setMaxListeners(100);

        this.waitlist = [];
        this.events = [];
        this.started = false;

        this.MAX_CONNECTIONS = 5000;
        this.MAX_ERROR_TRIALS = 100;
    }


    startConnecting(){

        if (this.started === false) {
            this.started = true;
            this._connectNewNodesWaitlist(true);
        }

    }

    addNewNodeToWaitlist(addresses, port, type, nodeConnected, level, backedBy){

        // addresses = "127.0.0.1";

        if ( (typeof addresses === "string" && addresses === '') || (typeof addresses === "object" && (addresses === null || addresses===[]))) return false;

        if (typeof addresses === "string" || !Array.isArray(addresses)) addresses = [addresses];

        let sckAddresses = [];
        for (let i=0; i<addresses.length; i++){

            let sckAddress = SocketAddress.createSocketAddress(addresses[i], port);

            let foundWaitList = this._searchNodesWaitlist(sckAddress);

            if ( foundWaitList !== null)  foundWaitList.pushBackedBy(backedBy);
            else  sckAddresses.push(sckAddress);

        }

        if (sckAddresses.length > 0){

            let waitListObject = new NodesWaitlistObject(sckAddresses, type, nodeConnected, level, backedBy);
            this.waitlist.push(waitListObject);

            this._tryToConnectNextNode(waitListObject);

            this.emitter.emit("waitlist/new-node", waitListObject);
            return waitListObject;
        }
        
        return null;
    }

    _findNodesWaitlist(address, port){

        let sckAddress = SocketAddress.createSocketAddress( address, port );

        for (let i=0; i<this.waitlist.length; i++)
            for (let j=0; j<this.waitlist[i].sckAddresses.length; j++)
                if (this.waitlist[i].sckAddresses[j].matchAddress(sckAddress) )
                    return i

        return -1;
    }

    _searchNodesWaitlist(address, port){

        let index = this._findNodesWaitlist(address, port);

        if (index === -1) return null;

        return this.waitlist[index];

    }

    /*
        Connect to all nodes
    */
    _connectNewNodesWaitlist(setTimeOut){

        this._deleteUselessWaitlist();

        for (let i=0; i < this.waitlist.length; i++){

            let nextNode = this.waitlist[i];

            this._tryToConnectNextNode(nextNode);

        }


        if (setTimeOut === true)
            setTimeout(()=>{ return this._connectNewNodesWaitlist( true ) }, consts.SETTINGS.PARAMS.WAITLIST.INTERVAL);
    }

    _tryToConnectNextNode(nextWaitListObject){

        //connect only to TERMINAL NODES
        if (nextWaitListObject.type === NodesWaitlistObject.NODES_WAITLIST_OBJECT_TYPE.NODE_PEER_TERMINAL_SERVER) {

            if (nextWaitListObject.checkLastTimeChecked(consts.SETTINGS.PARAMS.WAITLIST.TRY_RECONNECT_AGAIN) && nextWaitListObject.blocked === false &&
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

    async _connectNowToNewNode(nextWaitListObject){

        nextWaitListObject.connecting = true;

        //console.log("nextNode.sckAddresses", nextNode.sckAddresses);

        //trying to connect to each sckAddresses
        for (let i=0; i<nextWaitListObject.sckAddresses.length; i++) {

            //search if the new protocol was already connected in the past
            let nodeClient = NodesList.searchNodeSocketByAddress(nextWaitListObject.sckAddresses[i], 'all', ["id","uuid"]);
            if (nodeClient !== null) return nodeClient;

            if (nextWaitListObject.socket !== null) nodeClient = nextWaitListObject.socket;
            else nodeClient = new NodeClient();

            try {
                let answer = await nodeClient.connectTo(nextWaitListObject.sckAddresses[i], undefined, nextWaitListObject.level+1);

                if (answer) nextWaitListObject.socketConnected(nodeClient);
                else nextWaitListObject.socketErrorConnected();

                nextWaitListObject.connecting = false;
                return answer;
            }
            catch (Exception) {
                console.log("Error connecting to new protocol waitlist", Exception)
            }

        }
        nextWaitListObject.connecting = false;
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
                this.waitlist[i].type === NodesWaitlistObject.NODES_WAITLIST_OBJECT_TYPE.WEB_RTC_PEER) {

                this.emitter.emit("waitlist/delete-node", this.waitlist[i]);
                this.waitlist.splice(i, 1);

            }

        }

    }

    removedWaitListElement(address, port, backedBy){

        let index = this._findNodesWaitlist(address, port);

        if (index !== -1) {

            this.waitlist[index].removeBackedBy(backedBy);

            if ( this.waitlist[index].length === 0) {

                this.emitter.emit("waitlist/delete-node", this.waitlist[index]);
                this.waitlist.splice(index, 1);

            }

            return true;
        }

        return false;
    }

    resetWaitlist(){

        for (let i=0; i<this.waitlist.length; i++)
            this.waitlist[i].resetWaitlistNode();

    }

}


export default new NodesWaitlist();