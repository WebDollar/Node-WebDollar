let InterfaceBlockchainMining;

if (typeof window === 'undefined'){
    InterfaceBlockchainMining = require ('common/blockchain/interface-blockchain/mining/Interface-Blockchain-Backbone-Mining').default;
}  else {
    InterfaceBlockchainMining = require ('common/blockchain/interface-blockchain/mining/Interface-Blockchain-Browser-Mining').default;
}


class MiniBlockchainMining extends  InterfaceBlockchainMining {

    _simulatedNextBlockMining(nextBlock){

        nextBlock.data.computeAccountantTreeHashBlockData();
        nextBlock.data.computeHashBlockData();

    }

}

export default MiniBlockchainMining