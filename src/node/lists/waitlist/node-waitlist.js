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

    addNewNodeToWaitlist(address, port){

        let sckAddress = SocketAddress.createSocketAddress(address, port);

        //console.log("addNewNodeToWaitlist", sckAddress);

        if (this.searchNodeWaitlist(sckAddress)){
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
                return true;

        return false;
    }


    async startConnecting(){

        if (this.started === false) {
            this.started = true;
            this.connectNewNodeWaitlist();
        }

    }

    connectNewNodeWaitlist(){

        /*
            Connect to all nodes
        */

        console.log("Waitlist length", this.waitlist.length);
        //console.log(this.waitlist);

        for (let i=0; i < this.waitlist.length; i++){

            let nextNode = this.waitlist[i];
            if ( nextNode.checkLastTimeChecked(nodeWaitlistTryReconnectAgain) && nextNode.blocked===false && NodeLists.searchNodeSocketAddress(nextNode, 'all') === null){

                nextNode.blocked = true;

                //console.log("connectNewNodeWaitlist ", nextNode.sckAddress.toString() );

                this.connectNowToNewNode(nextNode.sckAddress).then( (connected)=>{
                    nextNode.checked = true;
                    nextNode.blocked = false;
                    nextNode.connected = connected;
                    nextNode.refreshLastTimeChecked();
                });

            }

        }

        let that = this;
        setTimeout(function(){return that.connectNewNodeWaitlist() }, nodeWaitlistInterval);
    }

    async connectNowToNewNode(sckAddress){

        //search if the new protocol was already connected in the past
        let nodeClient = NodeLists.searchNodeSocketAddress(sckAddress, 'all');
        if (nodeClient !== null) return nodeClient;

        nodeClient = new NodeClient();

        try{
            return await nodeClient.connectTo(sckAddress);
        }
        catch (Exception){
            console.log("Error connecting to new protocol waitlist", Exception.toString())
        }

        return false;
    }


}

exports.NodeWaitlist = new NodeWaitlist();