import BlockchainWallets from 'blockchain/wallets/Blockchain-Wallets'
import BlockchainChain from 'blockchain/chain/BlockchainChain'
import BlockchainMining from 'blockchain/mining/Blockchain-Mining'

class Blockchain{

    constructor(){
        this.Wallets = BlockchainWallets;
        this.Chain = BlockchainChain;
        this.Mining = BlockchainMining;
    }

}

export default new Blockchain()