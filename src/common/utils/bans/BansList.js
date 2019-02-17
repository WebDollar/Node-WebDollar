import BanObject from "./BanObject"
import NodesList from 'node/lists/Nodes-List';

class BansList{

    constructor(){

        this._bans = [];

        NodesList.emitter.on("nodes-list/disconnected", async (nodesListObject) => {

            //sckAddresses shouldn't be deleted after a socket is disconnected

        });

        this._intervalRemove = setInterval( this._removeEmptyBans.bind(this), 10*1000  );

    }

    isBanned(sckAddress){

        let pos = this._findBan(sckAddress);
        if ( pos < 0 ) return false;

        return this._bans[pos].isBanned(sckAddress);
    }

    addBan(sckAddress, banTime = 10000, banReason){

        if ( !sckAddress ) return false;

        if ( sckAddress  && sckAddress.node) sckAddress = sckAddress.node;
        if ( sckAddress  && sckAddress.sckAddress ) sckAddress = sckAddress.sckAddress;

        let ban = this.getBan(sckAddress);

        if ( !ban ) {

            ban = new BanObject(sckAddress);
            this._bans.push(ban);

        }

        ban.increaseBanTrials(banTime, banReason);

        return ban;
    }

    _findBan(sckAddress){

        for (let i = 0; i < this._bans.length; i++)
            if (this._bans[i].sckAddress.matchAddress(sckAddress, {"uuid": true} ) )
                return i;

        return -1;
    }

    getBan(sckAddress){

        let pos = this._findBan(sckAddress);
        if (pos >= 0) return this._bans[pos];

    }

    deleteBan(sckAddress){

        let position = this._findBan(sckAddress);
        if ( position >= 0 ){
            this._bans[position].upLiftBan();
            this._bans.splice(position, 1)
        }

    }

    _removeEmptyBans(){

        for (let i=this._bans.length-1; i>=0; i--)
            if ( !this._bans[i].sckAddress || !this._bans[i].isBanned() )
                this._bans.splice(i,1)

    }

    listBans(){
        
        if (this._bans.length > 0)
            console.info("BANNNNNNNNNNNNNNS");

        for (let i=0; i<this._bans.length; i++) {

            let timeLeft  = (this._bans[i].banTimestamp + this._bans[i].banTime) - new Date().getTime() ;

            if (timeLeft > 0)
                console.warn(this._bans[i].sckAddress.toString(),
                    "banTime", this._bans[i].banTime,
                    "timeLeft", timeLeft ,
                    "messages", this._bans[i].banReasons);
        }

    }

}

export default new BansList()
