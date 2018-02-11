const TIP_BAN_TIME = 5000;

class InterfaceBlockchainTipBan{

    constructor(sckAddress ){

        this.sckAddress = sckAddress;

        this.timeStamp = new Date().getTime();
        this.banTrials = 1;

    }

    isBanned(){

        let time = new Date().getTime();

        if ( (time - this.timeStamp) >= ( this.banTrials * TIP_BAN_TIME ))
            return true;

        return false;
    }

    increaseBanTrials(){
        let time = new Date().getTime();

        if ( (time - this.timeStamp) >= ( 10 * TIP_BAN_TIME )){ // no blocks for long time
            this.banTrials = 0;
        }

        this.timeStamp = time;
        this.banTrials++;
    }

    upLiftBan(){
        this.banTrials = 0;
        this.timeStamp = 0;
    }

}

export default InterfaceBlockchainTipBan