import NodesList from 'node/lists/nodes-list'

const NODES_WAITLIST_OBJECT_TYPE = {
    WEB_RTC_PEER: 0,
    NODE_PEER_TERMINAL_SERVER: 1,
};

class NodesWaitlistObject {

    constructor(sckAddresses, type){

        this.sckAddresses = sckAddresses;
        this.socket = null;

        this.blocked = false;
        this.checked = false;

        this.connecting = false;

        this.errorTrial = 0;
        this.lastTimeChecked = 0;

        this.type = type || NODES_WAITLIST_OBJECT_TYPE.NODE_PEER_TERMINAL_SERVER;
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

}

exports.NodesWaitlistObject = NodesWaitlistObject;
exports.NODES_WAITLIST_OBJECT_TYPE = NODES_WAITLIST_OBJECT_TYPE;