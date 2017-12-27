
import InterfaceBlockchainMining from 'common/blockchain/interface-blockchain/mining/Inteface-Blockchain-Mining'

class MiniBlockchainMining extends  InterfaceBlockchainMining {

    _simulatedNextBlockMining(nextBlock){

        nextBlock.data.computeAccountantTreeHashBlockData();
        nextBlock.data.computeHashBlockData();

    }

}

export default MiniBlockchainMining