import BlockchainWallets from 'blockchain/wallets/Blockchain-Wallets'

class Blockchain{

    constructor(){
        this.Wallets = BlockchainWallets;
    }

}

export default new Blockchain()