class WaitlistObject {

    constructor(address){

        this.address = address;
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

exports.WaitlistObject = WaitlistObject;