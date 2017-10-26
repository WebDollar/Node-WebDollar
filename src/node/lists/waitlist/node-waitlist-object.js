class NodeWaitlistObject {

    constructor(sckAddress){

        this.sckAddress = sckAddress;
        this.socket = null;

        this.blocked = false;
        this.checked = false;

        this.connecting = false;

        this.errorTrial = 0;
        this.lastTimeChecked = 0;
    }

    refreshLastTimeChecked(){
        this.lastTimeChecked = new Date().getTime();
    }

    checkLastTimeChecked(nodeTryReconnectAgain){

        let time = new Date().getTime();

        if ( (time - this.lastTimeChecked) >= nodeTryReconnectAgain + this.errorTrial*1000 )
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

}

exports.NodeWaitlistObject = NodeWaitlistObject;