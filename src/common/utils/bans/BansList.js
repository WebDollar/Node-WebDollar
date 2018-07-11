import BanObject from "./BanObject"
import NodesList from 'node/lists/Nodes-List';

class BansList{

    constructor(){

        this.bans = [];

        NodesList.emitter.on("nodes-list/disconnected", async (nodesListObject) => {

            //sckAddresses shouldn't be deleted after a socket is disconnected

        });

        setInterval( this._listBans.bind(this), 20*1000  )

    }

    isBanned(sckAddress){

        let ban = this.getBan(sckAddress);
        if (ban === null)
            return false;

        return ban.isBanned(sckAddress);
    }

    addBan(sckAddress, banTime = 10000, banReason){

        if (sckAddress === undefined || sckAddress === null) return false;

        if (typeof sckAddress === "object" && sckAddress.hasOwnProperty("node")) sckAddress = sckAddress.node.sckAddress;
        if (typeof sckAddress === "object" && sckAddress.hasOwnProperty("sckAddress")) sckAddress = sckAddress.node.sckAddress;

        let ban = this.getBan(sckAddress);

        if (ban === null) {

            ban = new BanObject(sckAddress);
            this.bans.push(ban);

        }

        ban.increaseBanTrials(banTime, banReason);

        this._removeEmptyBans();

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
            if (this.bans[i].sckAddress === undefined || !this.bans[i].isBanned() )
                this.bans.splice(i,1)

    }

    _listBans(){

        console.info("BANNNNNNNNNNNNNNS");
        for (let i=0; i<this.bans.length; i++) {


            let timeLeft  = (this.bans[i].banTimestamp + this.bans[i].banTime) - new Date().getTime() ;

            if (timeLeft > 0)
                console.warn("Address", this.bans[i].sckAddress.toString(),
                    "banTime", this.bans[i].banTime,
                    "timeLeft", timeLeft ,
                    "messages", this.bans[i].banReasons);
        }

    }

}

export default new BansList()