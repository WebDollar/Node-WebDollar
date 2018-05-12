import NodesList from 'node/lists/Nodes-List'
import NODES_TYPE from "node/lists/types/Nodes-Type"

class NodesWaitlistObject {

    constructor( sckAddresses, type, level, backedBy, connected){

        this.sckAddresses = sckAddresses;
        this.socket = null;

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

        this.date = new Date().getTime();

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

        return {

            type: this.type,
            addr: this.sckAddresses[0].toString(),
            port: this.sckAddresses[0].port,

        }

    }

    pushBackedBy( socket, connected ){

        //check if it is already found
        for (let i=0; i< this.backedBy.length; i++)
            if ( this.backedBy[i].sckAddress === socket.node.sckAddress ) {

                if (this.backedBy[i].connected !== connected) {
                    this.backedBy[i].connected = connected;

                    if (connected) this.backedByConnected++;
                    else this.backedByConnected--;
                }

                return false;
            }

        this.backedBy.push({
            socket: socket,
            connected: connected,
        });

        if (connected) this.backedByConnected++;
    }

    removeBackedBy(socket){
        for (let i=0; i< this.backedBy.length; i++)
            if (this.backedBy[i].socket === socket.node.sckAddress) {

                if (this.backedBy[i].connected)
                    this.backedByConnected --;

                this.backedBy.splice(i, 1);
                return;
            }
    }

    findBackedBy(socket){

        for (let i=0; i<this.backedBy.length; i++)
            if (this.backedBy[i].sckAddress === socket.node.sckAddress)
                return true;

        return null;
    }

    sortingScore(){

        if (this.isFallback === true) return 100000 - this.errorTrial*100;

        let score = 200;

        if (this.backedBy.length > 0){

            score += 10 * this.backedBy.length;
            score += 100 * this.backedByConnected;

        }

        score -= this.errorTrial * 100;

        return score;

    }

}

export default NodesWaitlistObject;