import InterfaceBlockchainBlockData from 'common/blockchain/interface-blockchain/blocks/Interface-Blockchain-Block-Data'

class PPoWBlockchainBlockData extends InterfaceBlockchainBlockData {

    constructor(blockchain, minerAddress, transactions, hashTransactions, hashData){

        super(blockchain, minerAddress, transactions, hashTransactions, hashData);

    }

}

export default PPoWBlockchainBlockData;