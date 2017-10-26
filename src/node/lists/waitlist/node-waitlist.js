import {NodeClient} from '../../websock/node_clients/socket/node-client.js';
import {NodeLists} from './../node-lists.js';
import {NodeWaitlistObject} from './node-waitlist-object.js';
import {SocketAddress} from './../../../common/sockets/socket-address.js';
import {nodeWaitlistTryReconnectAgain, nodeWaitlistInterval} from '../../../consts/const_global.js';

class NodeWaitlist {

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
            this._connectNewNodeWaitlist();
        }

    }

    addNewNodeToWaitlist(address, port){

        //address = "127.0.0.1";

        let sckAddress = SocketAddress.createSocketAddress(address, port);

        if (this.searchNodeWaitlist(sckAddress) !== null){
            return false;
        }

        let waitlistObject = new NodeWaitlistObject(sckAddress);
        this.waitlist.push(waitlistObject);

        //console.log("waitlist[]", this.waitlist);

        return waitlistObject;
    }

    searchNodeWaitlist(address, port){

        let sckAddress = SocketAddress.createSocketAddress( address, port );

        for (let i=0; i<this.waitlist.length; i++)
            if (this.waitlist[i].sckAddress.matchAddress(sckAddress) )
                return this.waitlist[i];

        return null;
    }


    /*
        Connect to all nodes
    */
    _connectNewNodeWaitlist(){

        console.log("Waitlist length", this.waitlist.length);
        //console.log(this.waitlist);

        for (let i=0; i < this.waitlist.length; i++){

            let nextNode = this.waitlist[i];
            if ( nextNode.checkLastTimeChecked(nodeWaitlistTryReconnectAgain) && nextNode.blocked===false && nextNode.connecting===false && NodeLists.searchNodeSocketAddress(nextNode, 'all') === null){

                nextNode.blocked = true;

                //console.log("connectNewNodeWaitlist ", nextNode.sckAddress.toString() );

                this._connectNowToNewNode(nextNode).then( (connected)=>{
                    nextNode.checked = true;
                    nextNode.blocked = false;
                    nextNode.connected = connected;
                    nextNode.refreshLastTimeChecked();
                });

            }

        }


        setTimeout(()=>{return this._connectNewNodeWaitlist() }, nodeWaitlistInterval);
    }

    async _connectNowToNewNode(nextNode){

        nextNode.connecting = true;

        //search if the new protocol was already connected in the past
        let nodeClient = NodeLists.searchNodeSocketAddress(nextNode.sckAddress, 'all');
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

exports.NodeWaitlist = new NodeWaitlist();