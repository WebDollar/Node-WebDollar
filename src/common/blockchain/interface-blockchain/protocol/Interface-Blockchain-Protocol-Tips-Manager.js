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

        let bestTip = this.blockchain.tipsAdministrator.getBestTip();

        console.log("this.blockchain.tipsAdministrator", this.blockchain.tipsAdministrator.tips);
        console.log("bestTip", bestTip);

        if (bestTip !== null){

            console.log("BEEEEEST TIIIP BEFORE", bestTip);

            let forkAnswer = await this.protocol.forkSolver.discoverAndProcessFork(bestTip);

            console.log("AFTER", bestTip);

            if (!forkAnswer){
                console.log("BANNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNN");
                this.blockchain.tipsAdministrator.addBan(bestTip.socket.node.sckAddress);
            } else {
                this.blockchain.tipsAdministrator.deleteBan(bestTip.socket.node.sckAddress);
            }

            //TODO process forkAnswer


            this.blockchain.tipsAdministrator.processTipsNewForkLengths();

            return true;
        }

        return false;
    }

    /*
        may the fork be with you Otto
     */
    async discoverNewForkTip(socket, newChainLength, header){

        if (typeof newChainLength !== "number") throw "newChainLength is not a number";

        if (newChainLength < this.blockchain.getBlockchainLength){
            console.log(colors.red("Your blockchain is smaller than mine"));
            throw "Your blockchain is smaller than mine";
        }

        let tip = this.blockchain.tipsAdministrator.getTip(socket);

        if (tip !== null) {
            this.blockchain.tipsAdministrator.updateTipNewForkLength(tip, newChainLength);
            return false;
        } else
            tip =  this.blockchain.tipsAdministrator.addTip(socket, newChainLength);

    }


}

export default InterfaceBlockchainProtocolForkManager;