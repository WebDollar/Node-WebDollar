import InterfaceBlockchainTip from './Interface-Blockchain-Tip'
import InterfaceBlockchainTipBan from './Interface-Blockchain-Tip-Ban'

/**
 * Blockchain contains a chain of blocks based on Proof of Work
 */

class InterfaceBlockchainTipsAdministrator {


    constructor (blockchain, agent){

        this.blockchain = blockchain;
        this.agent = agent;

        this.tips = [];
        this.bans = [];
    }

    initialize(blockchain){
        this.blockchain = blockchain;
        this.tips = []
    }

    getBestTip(){

        let maxTip = null;
        let maxTipChainLength = 0;

        for (let i=0; i<this.tips.length; i++)
            if (this.tips[i].forkChainLength > maxTipChainLength && !this.isBanned(this.tips[i].socket.node.sckAddress)){
                maxTipChainLength = this.tips[i].forkChainLength;
                maxTip = this.tips[i];
            }

        return maxTip;
    }


    findTip(socket){

        for (let i=0; i<this.tips.length; i++)
            if (this.tips[i] === socket || this.tips[i].socket === socket || this.tips[i].socket.node.sckAddress.matchAddress(socket.node.sckAddress) )
                return i;

        return null;
    }

    getTip(socket){
        let index = this.findTip(socket);
        if (index === null) return null;
        else return this.tips[index];
    }

    deleteTip(socket){

        let index = this.findTip(socket);

        if (index !== null) {
            this.tips.splice(index, 1);
            return true;
        }

        return false;

    }

    addTip(socket, forkChainLength) {

        if (this.findTip(socket) === null) {

            let tip = new InterfaceBlockchainTip(socket, forkChainLength, -1);

            this.tips.push(tip);
            return this.tips[this.tips.length - 1];
        }
    }

    updateTipNewForkLength(tip, forkChainLengthToDo ){

        if (tip === null) return null;

        if (tip.forkChainLength > forkChainLengthToDo) return; //nothing to update

        tip.forkChainLengthToDo = Math.max(forkChainLengthToDo, tip.forkChainLengthToDo);

        return tip;
    }

    processTipsNewForkLengths(){

        let blockchainLength = this.blockchain.getBlockchainLength;

        for (let i=this.tips.length-1; i>=0; i--){

            if (this.tips[i].forkChainLengthToDo !== -1 &&  this.tips[i].forkChainLengthToDo > this.tips[i].forkChainLength && this.tips[i].forkChainLengthToDo > blockchainLength)
                this.tips[i].updateToDo();

            if (this.tips[i].forkChainLength < blockchainLength){
                this.tips.splice(i,1);
            }

        }

    }



    isBanned(sckAddress){

        let ban = this.getBan(sckAddress);
        if (ban === null) return false;

        return ban.isBanned(sckAddress);
    }

    addBan(sckAddress){

        let ban = this.getBan(sckAddress);

        if (ban === null) {

            ban = new InterfaceBlockchainTipBan(sckAddress);
            this.bans.push(ban);

        } else {

            ban.increaseBanTrials();

        }

        return ban;
    }

    findBan(sckAddress){

        for (let i=0; i<this.bans.length; i++)
            if (this.bans[i].sckAddress.matchAddress(sckAddress, ["uuid"]) )
                return i;

        return null;
    }

    getBan(sckAddress){

        let index = this.findBan(sckAddress);
        if (index !== null) return this.bans[index];

        return null;
    }

    deleteBan(sckAddress){

        let ban = this.getBan(sckAddress);

        if (ban !== null)
            ban.upLiftBan();

    }

}

export default InterfaceBlockchainTipsAdministrator;