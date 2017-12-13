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

        return new InterfaceBlockchainBlock( 1, undefined, BlockchainGenesis.hashPrev, undefined, undefined, 0, {minerAddress: minerAddress, transactions: []}, 0 );
    }

    /*
        Generate a new block at the end of Blockchain
     */
    _createBlockNew(prevBlock, height, minerAddress){

        //validate miner Address

        return new InterfaceBlockchainBlock( 1, undefined, prevBlock.hash, undefined, undefined, 0, {minerAddress: minerAddress, transactions: []}, height);
    }

    createBlockNew(minerAddress){

        if (this.blockchain.getBlockchainLength() === 0){  //Genesis Block

            return this._createBlockGenesis( minerAddress||BlockchainGenesis.address );

        } else { //Fetch Transactions and Create Block

            return this._createBlockNew( this.blockchain.getBlockchainLastBlock(), this.blockchain.getBlockchainLength(), minerAddress||BlockchainGenesis.address  );

        }

    }


}

export default InterfaceBlockchainBlockCreator;