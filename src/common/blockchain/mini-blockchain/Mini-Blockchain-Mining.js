let InterfaceBlockchainMining;

if (!process.env.BROWSER){
    InterfaceBlockchainMining = require ('common/blockchain/interface-blockchain/mining/backbone/Interface-Blockchain-Backbone-Mining').default;
}  else {
    InterfaceBlockchainMining = require ('common/blockchain/interface-blockchain/mining/browser/Interface-Blockchain-Browser-Mining').default;
}


class MiniBlockchainMining extends  InterfaceBlockchainMining {

    _simulatedNextBlockMining(nextBlock){

        nextBlock.data.computeAccountantTreeHashBlockData();
        nextBlock.data.computeHashBlockData();

    }

}

export default MiniBlockchainMining