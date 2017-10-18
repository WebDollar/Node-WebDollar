import {NodeClient} from './../../clients/sockets/node-client.js';
import {NodeLists} from './../node-lists.js';
import {WaitlistObject} from './wailist-object.js';
import {nodeWaitlistTryReconnectAgain, nodeWaitlistInterval} from '../../../consts/const_global.js';

class NodeClientsWaitlist {

    /*
        nodeClientsWaitlist = []     //Addresses where it should connect too
    */

    constructor(){
        console.log("NodeServiceClients constructor");

        this.nodeClientsWaitlist = [];
    }

    addNewNodeToWaitlist(address){

        address = (address||'').toLowerCase();

        if (this.searchNodeWaitlist(address)){
            return false;
        }

        //console.log("nodeClientsWaitlist[]", this.nodeClientsWaitlist);
        this.nodeClientsWaitlist.push(new WaitlistObject(address));

    }

    searchNodeWaitlist(address){

        for (let i=0; i<this.nodeClientsWaitlist.length; i++)
            if (this.nodeClientsWaitlist[i].address === address)
                return true;

        return false;
    }


    async startConnecting(){

        this.connectNewNodeWaitlist();

    }

    connectNewNodeWaitlist(){

        /*
            Connect to all nodes
        */

        for (let i=0; i < this.nodeClientsWaitlist.length; i++){

            let nextNode = this.nodeClientsWaitlist[i];
            if ((nextNode.checkLastTimeChecked(nodeWaitlistTryReconnectAgain))&&(nextNode.blocked===false)&&(NodeLists.searchNodeSocketAddress(nextNode, true, true) === null)){

                nextNode.blocked = true;
                nextNode.checked = true;

                this.connectToNewNode(nextNode.address).then( (connected)=>{
                    nextNode.blocked = false;
                    nextNode.connected = connected;
                    this.nodeClientsWaitlist[i].refreshLastTimeChecked();
                });

            }

        }

        let that = this;
        setTimeout(function(){return that.connectNewNodeWaitlist() }, nodeWaitlistInterval);
    }

    async connectToNewNode(address){

        address = (address||'').toLowerCase();

        //search if the new node was already connected in the past
        let nodeClient = NodeLists.searchNodeSocketAddress(address);
        if (nodeClient !== null) return nodeClient;

        nodeClient = new NodeClient();

        try{
            return await nodeClient.connectTo(address);
        }
        catch (Exception){
            console.log("Error connecting to new node waitlist", Exception.toString())
        }

        return false;
    }


}

exports.NodeClientsWaitlist = new NodeClientsWaitlist();