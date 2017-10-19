class ContinentAddressObject  {

    constructor(address){

        this.address = address;
        this.lastTimeChecked = 0;

    }

    refreshLastTimeChecked(){
        this.lastTimeChecked = new Date().getTime();
    }

    checkLastTimeChecked(minimumDifferenceInMs){

        let time = new Date().getTime();

        if ( (time - this.lastTimeChecked) >= minimumDifferenceInMs)
            return true;

        return false;
    }

}

exports.ContinentAddressObject = ContinentAddressObject;