/*
    TUTORIAL BASED ON https://www.npmjs.com/package/ipaddr.js/
 */

import NODE_CONSENSUS_TYPE from "./types/Node-Consensus-Type"

class NodesListObject {

    constructor(socket, connectionType, nodeType, nodeConsensusType, isFallback){

        this.socket = socket;

        this.connectionType = connectionType;
        this.nodeType = nodeType;
        this.nodeConsensusType = nodeConsensusType||NODE_CONSENSUS_TYPE.NODE_CONSENSUS_PEER;

        this.date = new Date().getTime();
        this.isFallback = isFallback;

    }


    toJSON(){

        return {
            a: this.socket.node.sckAddress.getAddress(true, true), //addresses
            t: this.nodeType, //type
            c: true, //connected
        }

    }

}




export default NodesListObject;