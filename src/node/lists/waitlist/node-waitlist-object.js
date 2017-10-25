class NodeWaitlistObject {

    constructor(sckAddress){

        this.sckAddress = sckAddress;
        this.blocked = false;
        this.checked = false;

        this.connected = false;

        this.lastTimeChecked = 0;
    }

    refreshLastTimeChecked(){
        this.lastTimeChecked = new Date().getTime();
    }

    checkLastTimeChecked(nodeTryReconnectAgain){

        let time = new Date().getTime();

        if ( (time - this.lastTimeChecked) >= nodeTryReconnectAgain)
            return true;

        return false;
    }

}

exports.NodeWaitlistObject = NodeWaitlistObject;