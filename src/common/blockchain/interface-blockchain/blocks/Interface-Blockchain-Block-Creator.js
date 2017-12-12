import InterfaceBlockchainBlock from './Interface-Blockchain-Block'
import BlockchainGenesis from './Blockchain-Genesis'

class InterfaceBlockchainBlockCreator{

    constructor(blockchain){

        this.blockchain = blockchain;

    }

    createBlockGenesis(minerAddress){

        //validate miner Address

        return new InterfaceBlockchainBlock( 1, BlockchainGenesis.hashPrev, undefined, undefined, 0, [minerAddress]   );

    }

    createBlockNew(minerAddress){

        //validate miner Address

        return new InterfaceBlockchainBlock(1, hashPrev, undefined, undefined, 0, [minerAddress, data] );

    }

    createBlock(minerAddress){

        if (this.blockchain.getBlockchainLength() === 0){  //Genesis Block

            return this.createBlockGenesis( minerAddress||BlockchainGenesis.address );

        } else { //Fetch Transactions and Create Block

            return this.createBlockNew( minerAddress||BlockchainGenesis.address );

        }

    }


}

export default InterfaceBlockchainBlockCreator;