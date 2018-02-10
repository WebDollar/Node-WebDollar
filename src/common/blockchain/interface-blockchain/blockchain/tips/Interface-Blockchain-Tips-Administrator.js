import InterfaceBlockchainTip from './Interface-Blockchain-Tip'

/**
 * Blockchain contains a chain of blocks based on Proof of Work
 */

class InterfaceBlockchainTipsAdministrator {


    constructor (blockchain){

        this.blockchain = blockchain;
        this.forks = [];

        this.tipsId = 0;

        this.tips = [];
    }

    getBestTip(){

        let maxTip = null;
        let maxTipChainLength = 0;

        for (let i=0; i<this.tips.length; i++)
            if (this.tips[i].forkChainLength > maxTipChainLength){
                maxTipChainLength = this.forks[i].forkChainLength;
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

            this.tips.push(tip)
            return this.tips[this.tips.length - 1];
        }
    }

    updateTipNewForkLength(tip, forkChainLengthToDo ){

        if (tip === null) return null;

        if (tip.forkChainLength > forkChainLengthToDo) return; //nothing to update

        tip.forkChainLengthToDo = Math.max(forkChainLengthToDo, tip.forkChainLengthToDo);

        return tip;
    }

}

export default InterfaceBlockchainTipsAdministrator;