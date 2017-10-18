import {NodeClient} from './../../clients/sockets/node-client.js';
import {NodeLists} from './../node-lists.js';


class NodeClientsWaitlist {

    /*
        nodeClientsWaitlist = []     //Addresses where it should connect too
    */

    constructor(){
        console.log("NodeServiceClients constructor");

        this.nodeClientsWaitlist = [];
    }

    /*
        Get First  Node From Waitlist
     */
    getFirstNodeFromWaitlist(){

        let notFound = true, index = 0;
        while ((notFound === true)&&(index < this.nodeClientsWaitlist.length)){

            let topNode = this.nodeClientsWaitlist[index];
            if (NodeLists.searchNodeSocketAddress(topNode, true, true) === null){
                delete this.nodeClientsWaitlist[index];
                return topNode;
            }

            index++;
        }

        return null;
    }

    addNewNodeToWaitlist(address){

        address = (address||'').toLowerCase();

        if (this.searchNodeWaitlist(address)){
            return false;
        }

        this.nodeClientsWaitlist.push(address)

    }

    searchNodeWaitlist(address){
        for (let nodeClient in this.nodeClientsWaitlist)
            if (nodeClient === address)
                return true;

        return false;
    }


    async startConnecting(){

        await this.connectNewNodeWaitlist();

    }

    async connectNewNodeWaitlist(){

        let nextNode = this.getFirstNodeFromWaitlist();
        if (nextNode !== null){
            await this.connectToNewNode(nextNode);
        }

        let that = this;
        setTimeout(function(){return that.connectNewNodeWaitlist() }, 3000);
    }

    async connectToNewNode(address){

        address = (address||'').toLowerCase();

        //search if the new node was already connected in the past
        let nodeClient = NodeLists.searchNodeSocketAddress(address);
        if (nodeClient !== null) return nodeClient;

        nodeClient = new NodeClient();

        try{
            await nodeClient.connectTo(address);
        }
        catch (Exception){
            console.log("Error connecting to new node waitlist", Exception.toString())
        }

    }


}

exports.NodeClientsWaitlist = new NodeClientsWaitlist();