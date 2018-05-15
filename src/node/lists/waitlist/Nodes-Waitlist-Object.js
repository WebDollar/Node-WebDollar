import NodesList from 'node/lists/Nodes-List'
import NODES_TYPE from "node/lists/types/Nodes-Type"
import consts from 'consts/const_global'

const MAX_NUMBER_OF_BACKED_BY_FULL_NODE = 30;
const MAX_NUMBER_OF_BACKED_BY_LIGHT_NODE = 3;

class NodesWaitlistObject {

    constructor ( sckAddresses, type, level, backedBy, connected = false, socket = null ){

        this.sckAddresses = sckAddresses;
        this.socket = socket;

        this.connected = false;
        this.blocked = false;
        this.checked = false;

        if (backedBy === "fallback")
            this.isFallback = true;

        //backed by
        this.backedByConnected = 0;
        this.backedBy = [];
        this.pushBackedBy( backedBy, connected );

        this.connecting = false;

        this.errorTrial = 0;
        this.lastTimeChecked = 0;

        this.level = level||0;

        if (type === undefined) type = NODES_TYPE.NODE_TERMINAL;
        this.type = type;
    }

    refreshLastTimeChecked(){
        this.lastTimeChecked = new Date().getTime();
    }

    checkLastTimeChecked(timeTryReconnectAgain){

        let time = new Date().getTime();

        if ( (time - this.lastTimeChecked) >= timeTryReconnectAgain + this.errorTrial*5000 )
            return true;

        return false;
    }

    socketConnected(socket){

        this.errorTrial = 0;
        this.socket = socket;

    }

    socketErrorConnected(){

        this.errorTrial++;

        if (this.isFallback === true) {

            if (process.env.BROWSER)
                this.errorTrial = Math.min(this.errorTrial, 5);
            else
                this.errorTrial = Math.min(this.errorTrial, 5 + Math.floor( Math.random() * 5) );

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
        this.errorTrial = 0;

    }


    toJSON(){

        let obj = {

            type: this.type,
            addr: this.sckAddresses[0].getAddress(true, true),

        };

        if (this.connected) obj.connected = this.connected;

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

        if (this.type === NODES_TYPE.NODE_WEB_PEER)
            max = MAX_NUMBER_OF_BACKED_BY_LIGHT_NODE;
        else if (this.type === NODES_TYPE.NODE_TERMINAL)
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

        if (this.isFallback === true) return 100000 - this.errorTrial*100;

        let score = 200;

        score += 1000 * this.connected;

        if (this.backedBy.length > 0){

            score += 10 * this.backedBy.length;
            score += 100 * this.backedByConnected;

            if (this.sckAddresses[0].SSL) //SSL +5000
                score += 5000;

        }

        score -= this.errorTrial * 100;

        return score;

    }

}

export default NodesWaitlistObject;