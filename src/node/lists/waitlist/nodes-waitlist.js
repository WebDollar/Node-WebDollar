import {NodeClient} from '../../websock/node_clients/socket/node-client.js';
import {NodesList} from '../nodes-list.js';
import {NodesWaitlistObject} from './nodes-waitlist-object.js';
import {SocketAddress} from './../../../common/sockets/socket-address.js';
import {nodesWaitlistTryReconnectAgain, nodesWaitlistInterval} from '../../../consts/const_global.js';

class NodesWaitlist {

    /*
        waitlist = []     //Addresses where it should connect too
        stated = false;
    */

    constructor(){
        console.log("NodeServiceClients constructor");

        this.waitlist = [];
        this.started = false;
    }


    async startConnecting(){

        if (this.started === false) {
            this.started = true;
            this._connectNewNodesWaitlist();
        }

    }

    addNewNodeToWaitlist(address, port){

        //address = "127.0.0.1";

        let sckAddress = SocketAddress.createSocketAddress(address, port);

        if (this.searchNodesWaitlist(sckAddress) !== null){
            return false;
        }

        let waitlistObject = new NodesWaitlistObject(sckAddress);
        this.waitlist.push(waitlistObject);

        //console.log("waitlist[]", this.waitlist);

        return waitlistObject;
    }

    searchNodesWaitlist(address, port){

        let sckAddress = SocketAddress.createSocketAddress( address, port );

        for (let i=0; i<this.waitlist.length; i++)
            if (this.waitlist[i].sckAddress.matchAddress(sckAddress) )
                return this.waitlist[i];

        return null;
    }


    /*
        Connect to all nodes
    */
    _connectNewNodesWaitlist(){

        console.log("Waitlist length", this.waitlist.length);
        //console.log(this.waitlist);

        for (let i=0; i < this.waitlist.length; i++){

            let nextNode = this.waitlist[i];
            if ( nextNode.checkLastTimeChecked(nodesWaitlistTryReconnectAgain) && nextNode.blocked===false && nextNode.connecting===false && NodesList.searchNodeSocketAddress(nextNode, 'all') === null){

                nextNode.blocked = true;

                //console.log("connectNewNodesWaitlist ", nextNode.sckAddress.toString() );

                this._connectNowToNewNode(nextNode).then( (connected)=>{
                    nextNode.checked = true;
                    nextNode.blocked = false;
                    nextNode.connected = connected;
                    nextNode.refreshLastTimeChecked();
                });

            }

        }


        setTimeout(()=>{return this._connectNewNodesWaitlist() }, nodesWaitlistInterval);
    }

    async _connectNowToNewNode(nextNode){

        nextNode.connecting = true;

        //search if the new protocol was already connected in the past
        let nodeClient = NodesList.searchNodeSocketAddress(nextNode.sckAddress, 'all');
        if (nodeClient !== null) return nodeClient;

        if (nextNode.socket !== null) nodeClient = nextNode.socket;
        else nodeClient = new NodeClient();

        try{
            let answer = await nodeClient.connectTo(nextNode.sckAddress);

            if (answer)  nextNode.socketConnected(nodeClient);
            else nextNode.socketErrorConnected();

            nextNode.connecting = false;
            return answer;
        }
        catch (Exception){
            console.log("Error connecting to new protocol waitlist", Exception.toString())
        }

        nextNode.connecting = false;
        return false;
    }


}

exports.NodesWaitlist = new NodesWaitlist();