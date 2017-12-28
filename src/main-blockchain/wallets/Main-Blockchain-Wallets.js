import MiniBlockchainAddress from 'common/blockchain/mini-blockchain/Mini-Blockchain-Address'

class MainBlockchainWallets{

    constructor(blockchain, password = 'password'){

        this.blockchain = blockchain;
        
        if (typeof this.blockchainAddress === 'undefined') {
            this.blockchainAddress = this.createNewAddress();
            
            this.blockchainAddress.encrypt(password);
            this.blockchainAddress.save();
            this.blockchainAddress.decrypt(password);
        } else {
            this.blockchainAddress.load();
            this.blockchainAddress.decrypt(password);
        }

    }

    createNewAddress(){

        let blockchainAddress = new MiniBlockchainAddress();
        blockchainAddress.createNewAddress();

        return blockchainAddress;
    }

}

export default MainBlockchainWallets