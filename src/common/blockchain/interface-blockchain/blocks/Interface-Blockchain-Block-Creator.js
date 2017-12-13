import InterfaceBlockchainBlock from './Interface-Blockchain-Block'
import BlockchainGenesis from './Blockchain-Genesis'

class InterfaceBlockchainBlockCreator{

    constructor(blockchain){

        this.blockchain = blockchain;

    }

    /*
        Generate a Genesis Block (no previous block)
     */
    _createBlockGenesis(minerAddress){

        //validate miner Address

        return new InterfaceBlockchainBlock( 1, undefined, BlockchainGenesis.hashPrev, undefined, undefined, 0, [minerAddress], 0 );
    }

    /*
        Generate a new block at the end of Blockchain
     */
    _createBlockNew(minerAddress){

        //validate miner Address

        return new InterfaceBlockchainBlock( 1, undefined, hashPrev, undefined, undefined, 0, [minerAddress, data], 0 );
    }

    createBlockNew(minerAddress){

        if (this.blockchain.getBlockchainLength() === 0){  //Genesis Block

            return this._createBlockGenesis( minerAddress||BlockchainGenesis.address );

        } else { //Fetch Transactions and Create Block

            return this._createBlockNew( minerAddress||BlockchainGenesis.address, this.blockchain.getBlockchainLastBlock(), this.blockchain.getBlockchainLength() );

        }

    }


}

export default InterfaceBlockchainBlockCreator;