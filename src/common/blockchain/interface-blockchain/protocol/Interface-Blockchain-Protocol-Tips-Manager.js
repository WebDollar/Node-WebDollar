const colors = require('colors/safe');

class InterfaceBlockchainProtocolTipsManager {

    constructor(blockchain, protocol){

        this.blockchain = blockchain;
        this.protocol = protocol;

        setTimeout(async ()=>{return await this.processTips()}, 50);
    }


    async processTips(){

        if (this.blockchain === undefined) {
            setTimeout(async ()=>{ return await this.processTips() }, 50);
            return false;
        }

        this.blockchain.tipsAdministrator.processTipsNewForkLengths();

        let bestTip = this.blockchain.tipsAdministrator.getBestTip();
        let result = false;

        // for (let i=0; i<this.blockchain.tipsAdministrator.tips.length; i++)
        //     console.log("tip: ",this.blockchain.tipsAdministrator.tips[i].toString());
        //
        // console.log("bestTip", bestTip !== null ? bestTip.toString() : "null");

        if (bestTip !== null) {

            console.log("BEEEEEST TIIIP BEFORE");
            bestTip.toString();

            console.log("bans bans bans bans bans bans bans bans");
            console.log(this.blockchain.tipsAdministrator.bans);

            let forkAnswer = await this.protocol.forkSolver.discoverAndProcessFork(bestTip);

            console.log("AFTER");
            bestTip.toString();

            if (!forkAnswer) {
                console.log("BANNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNN");
                this.blockchain.tipsAdministrator.addBan(bestTip.socket.node.sckAddress);

                bestTip.forkResolve(true);
            } else {
                this.blockchain.tipsAdministrator.deleteBan(bestTip.socket.node.sckAddress);

                bestTip.forkResolve(false);
            }

            result = true;
        }

        setTimeout(async ()=>{return await this.processTips()}, 50);

        return result;
    }

    /*
        may the fork be with you Otto
     */
    async discoverNewForkTip(socket, newChainLength, forkLastBlockHeader){

        if (typeof newChainLength !== "number") throw "newChainLength is not a number";

        if (newChainLength < this.blockchain.blocks.length){
            console.log(colors.red("Your blockchain is smaller than mine"));
            throw "Your blockchain is smaller than mine";
        }

        let tip = this.blockchain.tipsAdministrator.getTip(socket);

        if (tip !== null)
            this.blockchain.tipsAdministrator.updateTipNewForkLength(tip, newChainLength, forkLastBlockHeader);
        else
            tip =  this.blockchain.tipsAdministrator.addTip(socket, newChainLength, forkLastBlockHeader);

        if (tip === null)
            return false; // the tip is not valid
        else
            return tip.forkPromise;
    }


}

export default InterfaceBlockchainProtocolTipsManager;