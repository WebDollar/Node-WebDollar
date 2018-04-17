import BanObject from "./BanObject"

class BansList{

    constructor(){

        this.bans = [];

    }

    isBanned(sckAddress){

        let ban = this.getBan(sckAddress);
        if (ban === null)
            return false;

        return ban.isBanned(sckAddress);
    }

    addBan(sckAddress, banTime = 10000, banReason){

        if (typeof sckAddress === "object" && sckAddress.hasOwnProperty("node")) sckAddress = sckAddress.node.sckAddress;
        if (typeof sckAddress === "object" && sckAddress.hasOwnProperty("sckAddress")) sckAddress = sckAddress.node.sckAddress;

        let ban = this.getBan(sckAddress);

        if (ban === null) {

            ban = new BanObject(sckAddress);
            this.bans.push(ban);

        }

        ban.increaseBanTrials(banTime, banReason);

        this._removeEmptyBans();

        this._listBans();

        return ban;
    }

    findBan(sckAddress){

        for (let i = 0; i < this.bans.length; i++)
            if (this.bans[i].sckAddress.matchAddress(sckAddress, ["uuid"]) )
                return i;

        return null;
    }

    getBan(sckAddress){

        let index = this.findBan(sckAddress);
        if (index !== null)
            return this.bans[index];

        return null;
    }

    deleteBan(sckAddress){

        let ban = this.getBan(sckAddress);

        if (ban !== null)
            ban.upLiftBan();

    }

    _removeEmptyBans(){

        for (let i=this.bans.length-1; i>=0; i--)
            if (!this.bans[i].isBanned() )
                this.bans.splice(i,1)

    }

    _listBans(){

        console.info("BANNNNNNNNNNNNNNS");
        for (let i=0; i<this.bans.length; i++)
            console.warn( "Address", this.bans[i].sckAddress.getOriginalAddress(),
                          "banTime", this.bans[i].banTime,
                          "timeLeft", new Date().getTime() -  (this.bans[i].banTimestamp + this.bans[i].banTime) ,
                          "messages", this.bans[i].banReasons );

    }

}

export default new BansList()