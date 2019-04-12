const fs = require('fs');
import {EOL} from 'os';
import AddressBanObject from "./AddressBanObject"
import Blockchain from "main-blockchain/Blockchain"

class AddressBanList {

    constructor() {

        this._bans = [];
        this._intervalRemove = setInterval(this._removeEmptyBans.bind(this), 60 * 1000);

    }

    isBanned(address) {

        let pos = this._findBan(address);
        if (pos < 0) return false;

        return this._bans[pos].isBanned(address);
    }

    addBan(address, banTime = 10000, banReason) {

        if (!address) {
            console.log("Not address");
            return false;
        }

        let ban = this.getBan(address);

        if (!ban) {

            ban = new AddressBanObject(address);
            this._bans.push(ban);

        }
        ban.increaseBanTrials(banTime, banReason);

        if (Blockchain.PoolManagement !== undefined && Blockchain.PoolManagement.poolStarted) {
            if (Blockchain.PoolManagement.poolData !== undefined) {
                for (let blockInfo of Blockchain.PoolManagement.poolData.blocksInfo)
                    for (let blockInformationMinerInstance of blockInfo.blockInformationMinersInstances)
                        if (blockInformationMinerInstance.minerAddress.equals(address)) {

                            blockInformationMinerInstance.cancelDifficulties("pos");
                            blockInformationMinerInstance.cancelReward();

                            blockInformationMinerInstance.penalty = true;
                        }
            } else console.info("Pool data is undefined!?");
        }

        return ban;
    }

    _findBan(address) {

        for (let i = 0; i < this._bans.length; i++)
            if (this._bans[i].address.equals(address))
                return i;

        return -1;
    }

    getBan(address) {

        let pos = this._findBan(address);
        if (pos >= 0) return this._bans[pos];

    }

    deleteBan(address) {

        let position = this._findBan(address);
        if (position >= 0) {
            this._bans[position].upLiftBan();
            this._bans.splice(position, 1)
        }

    }

    _removeEmptyBans() {

        for (let i = this._bans.length - 1; i >= 0; i--)
            if (!this._bans[i].address || !this._bans[i].isBanned())
                this._bans.splice(i, 1)

    }

    listBans() {
        if (this._bans.length > 0)
            console.info("ADDRESS BANS");

        for (let i = 0; i < this._bans.length; i++) {

            let timeLeft = (this._bans[i].banTimestamp + this._bans[i].banTime) - new Date().getTime();

            if (timeLeft > 0)
                console.warn(this._bans[i].addressWIF,
                    "banTime", this._bans[i].banTime,
                    "timeLeft", timeLeft,
                    "messages", this._bans[i].banReasons);
        }

    }

    saveBans() {

        try{

            let bansFileStream = fs.createWriteStream('address-ban-list.txt', {'flags': 'w'});
            for (let i = 0; i < this._bans.length; i++) {

                let timeLeft = (((this._bans[i].banTimestamp + this._bans[i].banTime) - new Date().getTime()) / 3600 / 1000).toFixed(2);
                bansFileStream.write(timeLeft + ";" + this._bans[i].addressWIF + ";" + this._bans[i].banReasons + EOL);

            }
            bansFileStream.end();

        }catch(err){

        }

    }

}

export default new AddressBanList()
