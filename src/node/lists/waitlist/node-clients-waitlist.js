
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

    async connectNewNode(address){
        address = (address||'').toLowerCase();

        //search if the new node was already connected in the past
        let nodeClient = NodeLists.searchNodeSocketAddress(address, true, true);
        if (nodeClient !== null) return nodeClient;

        nodeClient = new NodeClient();

        await nodeClient.connectTo(address)

    }


}

exports.NodeClientsWaitlist = new NodeClientsWaitlist();