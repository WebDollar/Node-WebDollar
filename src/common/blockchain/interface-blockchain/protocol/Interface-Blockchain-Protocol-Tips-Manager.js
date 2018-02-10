const colors = require('colors/safe');
const interval = require('interval-promise')

class InterfaceBlockchainProtocolForkManager {

    constructor(blockchain, protocol){

        this.blockchain = blockchain;
        this.protocol = protocol;

        interval( async () => {
            await this.processTips()
        }, 10, );

    }

    async processTips(){

        let bestTip = this.blockchain.tipsAdministrator.getBestTip();

        if (bestTip !== null){

            await this.protocol.forkSolver.discoverAndProcessFork(bestTip);

            if (bestTip.forkChainLengthToDo !== -1 &&  bestTip.forkChainLengthToDo > bestTip.forkChainLength )
                this.discoverAndProcessFork(socket, processingSocket.forkChainLengthToDo );
            else {
                
            }

        }
    }

    /*
        may the fork be with you Otto
     */
    async discoverNewForkTip(socket, newChainLength){

        if (typeof newChainLength !== "number") throw "newChainLength is not a number";

        if (newChainLength > this.blockchain.getBlockchainLength){
            throw "Your blockchain is smaller than mine";
        }

        let tip = this.blockchain.tipsAdministrator.getTip(socket);

        if (tip !== null) {
            this.blockchain.tipsAdministrator.updateTipNewForkLength(tip, newChainLength);
            return false;
        } else
            tip =  this.blockchain.tipsAdministrator.addSocketProcessing(socket);

    }


}

export default InterfaceBlockchainProtocolForkManager;