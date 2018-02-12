const colors = require('colors/safe');
const intervalPromise = require('interval-promise')

class InterfaceBlockchainProtocolForkManager {

    constructor(blockchain, protocol){

        this.blockchain = blockchain;
        this.protocol = protocol;

        intervalPromise( async () => {
            await this.processTips()
        }, 50, );

    }

    async processTips(){

        if (this.blockchain === undefined) return; //not yet

        this.blockchain.tipsAdministrator.processTipsNewForkLengths();

        let bestTip = this.blockchain.tipsAdministrator.getBestTip();

        // for (let i=0; i<this.blockchain.tipsAdministrator.tips.length; i++)
        //     console.log("tip: ",this.blockchain.tipsAdministrator.tips[i].toString());
        //
        // console.log("bestTip", bestTip !== null ? bestTip.toString() : "null");

        if (bestTip !== null){

            console.log("BEEEEEST TIIIP BEFORE");
            bestTip.toString()

            console.log("bans bans bans bans bans bans bans bans");
            console.log(this.blockchain.tipsAdministrator.bans);

            let forkAnswer = await this.protocol.forkSolver.discoverAndProcessFork(bestTip);

            console.log("AFTER");
            bestTip.toString();

            if (!forkAnswer){
                console.log("BANNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNN");
                this.blockchain.tipsAdministrator.addBan(bestTip.socket.node.sckAddress);
            } else {
                this.blockchain.tipsAdministrator.deleteBan(bestTip.socket.node.sckAddress);
            }

            //TODO process forkAnswer

            return true;
        }

        return false;
    }

    /*
        may the fork be with you Otto
     */
    async discoverNewForkTip(socket, newChainLength, forkLastBlockHeader){

        if (typeof newChainLength !== "number") throw "newChainLength is not a number";

        if (newChainLength < this.blockchain.getBlockchainLength){
            console.log(colors.red("Your blockchain is smaller than mine"));
            throw "Your blockchain is smaller than mine";
        }

        let tip = this.blockchain.tipsAdministrator.getTip(socket);

        if (tip !== null) {
            this.blockchain.tipsAdministrator.updateTipNewForkLength(tip, newChainLength, forkLastBlockHeader);
            return false;
        } else
            tip =  this.blockchain.tipsAdministrator.addTip(socket, newChainLength, forkLastBlockHeader);

    }


}

export default InterfaceBlockchainProtocolForkManager;