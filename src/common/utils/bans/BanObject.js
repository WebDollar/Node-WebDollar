import BansList from "./BansList";

class BanObject{

    constructor(sckAddress ){

        this.sckAddress = sckAddress;

        this.timeStamp = new Date().getTime();
        this.banTime = 0;
        this.banTimestamp = 0;
        this.banReasons = [];

    }

    isBanned(){

        let timestamp = new Date().getTime();

        if ( (timestamp - this.banTimestamp) < this.banTime)
            return true;

        return false;
    }

    increaseBanTrials(banTime, banReason){

        let timestamp = new Date().getTime();

        if ( (timestamp - this.banTimestamp) >= ( 1.5*this.banTime )){ // no blocks for long time
            this.upLiftBan();
        }

        if (this.banTimestamp === 0)
            this.banTimestamp = timestamp;

        this.banTime = banTime;
        this.banReasons.push(banReason);
    }

    upLiftBan(){
        this.timeStamp = 0;
        this.banTimestamp = 0;
        this.banReasons = [];
    }

}

export default BanObject