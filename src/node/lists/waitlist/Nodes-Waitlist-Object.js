import NodesList from 'node/lists/Nodes-List'
import NODE_TYPE from "node/lists/types/Node-Type"
import NODE_CONSENSUS_TYPE from "node/lists/types/Node-Consensus-Type"
import consts from 'consts/const_global'
import Blockchain from "main-blockchain/Blockchain"

const MAX_NUMBER_OF_BACKED_BY_FULL_NODE = 30;
const MAX_NUMBER_OF_BACKED_BY_LIGHT_NODE = 3;

class NodesWaitlistObject {

    constructor ( sckAddresses, nodeType, nodeConsensusType,  level, backedBy, connected = false, socket = null ){

        this.sckAddresses = sckAddresses;
        this.socket = socket;

        this.connected = false;
        this.blocked = false;
        this.checked = false;

        if (backedBy === "fallback")
            this.isFallback = true;
        else
            this.isFallback = false;

        //backed by
        this.backedByConnected = 0;
        this.backedBy = [];
        this.pushBackedBy( backedBy, connected );

        this.connecting = false;

        this.errorTrials = 0;
        this.lastTimeChecked = 0;

        this.level = level||0;

        if (nodeType === undefined) nodeType = NODE_TYPE.NODE_TERMINAL;
        this.nodeType = nodeType;

        this.nodeConsensusType = nodeConsensusType || NODE_CONSENSUS_TYPE.NODE_CONSENSUS_PEER;
    }

    refreshLastTimeChecked(){
        this.lastTimeChecked = new Date().getTime();
    }

    checkLastTimeChecked(timeTryReconnectAgain){

        let time = new Date().getTime();

        if ( (time - this.lastTimeChecked) >= timeTryReconnectAgain + this.errorTrials * ( 3000 + Math.random()*8000 ) )
            return true;

        return false;
    }

    socketConnected(socket){

        this.errorTrials = 0;
        this.socket = socket;

    }

    socketErrorConnected(){

        this.errorTrials++;

        if (this.isFallback === true) {

            if (process.env.BROWSER)
                this.errorTrials = Math.min(this.errorTrials, 3 + Math.floor( Math.random() * 2) );
            else
                this.errorTrials = Math.min(this.errorTrials, 4 + Math.floor( Math.random() * 5) );

        }

    }

    checkIsConnected() {

        //checking if I had been connected in the past

        for (let i = 0; i < this.sckAddresses.length; i++) {
            let socket = NodesList.searchNodeSocketByAddress(this.sckAddresses[i], 'all', ["ip","uuid"]);
            if (socket !== null)
                return socket;
        }

        return null;
    }

    toString(){

        let text = "";
        for (let i=0; i<this.sckAddresses.length; i++)
            text += this.sckAddresses[i].toString()+ "   ";

        return text;

    }


    resetWaitlistNode(){

        this.lastTimeChecked = 0;
        this.errorTrials = 0;

    }


    toJSON(){

        let obj = {

            a: this.sckAddresses[0].getAddress(true, true), // address
            t: this.nodeType, // type

        };

        if (this.connected) obj.c = this.connected;

        return obj;
    }

    pushBackedBy( sckAddress, connected ){

        if (typeof sckAddress === "object" && sckAddress.node !== undefined && sckAddress.node.sckAddress !== undefined)
            sckAddress = sckAddress.node.sckAddress;

        //check if it is already found
        for (let i=0; i< this.backedBy.length; i++)
            if ( this.backedBy[i].sckAddress === sckAddress ) {

                if (this.backedBy[i].connected !== connected) {
                    this.backedBy[i].connected = connected;

                    if (connected) this.backedByConnected++;
                    else this.backedByConnected--;
                }

                return false;
            }

        let max;

        if (this.nodeType === NODE_TYPE.NODE_WEB_PEER)
            max = MAX_NUMBER_OF_BACKED_BY_LIGHT_NODE;
        else if (this.nodeType === NODE_TYPE.NODE_TERMINAL)
            max  = MAX_NUMBER_OF_BACKED_BY_FULL_NODE;

        if ( this.backedBy.length < max ){

            this.backedBy.push({
                socket: sckAddress,
                connected: connected,
            });

            if (connected) this.backedByConnected++;

        }

    }

    removeBackedBy(sckAddress){

        for (let i=0; i< this.backedBy.length; i++)
            if (this.backedBy[i].sckAddress === sckAddress) {

                if (this.backedBy[i].connected)
                    this.backedByConnected --;

                this.backedBy.splice(i, 1);
                return;
            }

    }

    findBackedBy(sckAddress){

        for (let i=0; i<this.backedBy.length; i++)
            if (this.backedBy[i].sckAddress === sckAddress)
                return true;

        return null;
    }

    sortingScore(){

        if (this.isFallback === true) return 1000000 - this.errorTrials*100;

        let score = 200 + Math.random()*100;

        score += (this.connected ? 50000 : 0);

        if (this.backedBy.length > 0){

            score += 10 * this.backedBy.length;
            score += 100 * this.backedByConnected;

        }

        if (this.sckAddresses[0].SSL) //SSL +5000
            score += 80000;

        if (this.socket !== undefined && this.socket !== null){

            let socket = this.socket;
            if (socket.hasOwnProperty("socket")) socket = socket.socket;

            if (socket.node.protocol.blocks === undefined) score -= 300;
            else {

                let diff = Math.abs ( Blockchain.blockchain.blocks.length - socket.node.protocol.blocks);
                if ( diff <= 2 ) score += 10000; else
                if ( diff <= 5 ) score += 5000; else
                if ( diff <= 10 ) score += 1000; else
                if ( diff <= 30 ) score += 100; else
                if ( diff >= 30 ) score -= 3000 - diff;
            }
        }

        score -= this.errorTrials * 100;

        return score;

    }

}

export default NodesWaitlistObject;