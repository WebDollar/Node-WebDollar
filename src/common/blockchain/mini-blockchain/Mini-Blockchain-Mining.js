
import InterfaceBlockchainMining from 'common/blockchain/interface-blockchain/mining/Inteface-Blockchain-Mining'

class MiniBlockchainMining extends  InterfaceBlockchainMining{

    _simulatedNextBlockMining(nextBlock){

        nextBlock.data.hashAccountantTree = this.blockchain.accountantTree.root.hash.sha256;

    }

}

export default MiniBlockchainMining