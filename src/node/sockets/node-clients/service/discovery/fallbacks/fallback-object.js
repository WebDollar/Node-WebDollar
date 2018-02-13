class FallBackObject {

    constructor(url){

        this.url = url;
        this.checked = false;

        this.errorTrials = 0;
        this.lastTimeChecked = 0;
    }

    refreshLastTimeChecked(){
        this.lastTimeChecked = new Date().getTime();
    }

    checkLastTimeChecked(timeTryReconnectAgain){

        let time = new Date().getTime();

        if ( (time - this.lastTimeChecked) >= ( timeTryReconnectAgain + this.errorTrials*5000 ))
            return true;

        return false;
    }

}

export default FallBackObject;