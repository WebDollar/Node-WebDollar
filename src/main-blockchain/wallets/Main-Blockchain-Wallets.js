import MiniBlockchainAddress from 'common/blockchain/mini-blockchain/Mini-Blockchain-Address'

class MainBlockchainWallets{

    constructor(blockchain){

        this.blockchain = blockchain;

    }

    createNewAddress(){

        let blockchainAddress = new MiniBlockchainAddress();
        blockchainAddress.createNewAddress();

        return blockchainAddress;
    }

}

export default MainBlockchainWallets