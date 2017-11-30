import MiniBlockchainAddress from 'common/blockchain/mini-blockchain/addresses/Mini-Blockchain-Address'

class BlockchainWallets{

    createNewAddress(){

        let blockchainAddress = new MiniBlockchainAddress();
        blockchainAddress.createNewAddress();

        return blockchainAddress;
    }

}

export default new BlockchainWallets()