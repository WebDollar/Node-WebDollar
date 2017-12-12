import InterfaceBlockchainBlock from './Interface-Blockchain-Block'
import BlockchainGenesis from './Blockchain-Genesis'

class InterfaceBlockchainBlockCreator{

    constructor(blockchain){

        this.blockchain = blockchain;

    }

    createBlockGenesis(minerAddress){

        return new InterfaceBlockchainBlock( 1, BlockchainGenesis.hashPrev, undefined, undefined, 0, [minerAddress]   );

    }

    createBlock(hashPrev, data, minerAddress){

        return new InterfaceBlockchainBlock(1, hashPrev, undefined, undefined, 0, [minerAddress, data] );

    }

}

export default InterfaceBlockchainBlockCreator;