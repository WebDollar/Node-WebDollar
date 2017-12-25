import InterfaceBlockchainBlock from './Interface-Blockchain-Block'
import BlockchainGenesis from './Blockchain-Genesis'
import InterfaceSatoshminDB from 'common/satoshmindb/Interface-SatoshminDB'

class InterfaceBlockchainBlockCreator{

    constructor(blockchain){

        this.blockchain = blockchain;
        this.db = new InterfaceSatoshminDB();
    }

    /*
        Generate a Genesis Block (no previous block)
     */
    _createBlockGenesis(minerAddress){

        //validate miner Address

        return new InterfaceBlockchainBlock( 1, undefined, BlockchainGenesis.hashPrev, undefined, undefined, 0, {minerAddress: minerAddress, transactions: []}, 0, this.db );
    }

    /*
        Generate a new block at the end of Blockchain
     */
    _createBlockNew(prevBlock, height, minerAddress){

        //validate miner Address

        return new InterfaceBlockchainBlock( 1, undefined, prevBlock.hash, undefined, undefined, 0, {minerAddress: minerAddress, transactions: []}, height, this.db);
    }

    createBlockNew(minerAddress){

        if (this.blockchain.getBlockchainLength() === 0){  //Genesis Block

            return this._createBlockGenesis( minerAddress||BlockchainGenesis.address );

        } else { //Fetch Transactions and Create Block

            return this._createBlockNew( this.blockchain.getBlockchainLastBlock(), this.blockchain.getBlockchainLength(), minerAddress||BlockchainGenesis.address  );

        }

    }

    createBlockEmpty(height){

        return new InterfaceBlockchainBlock( 1, undefined, undefined, undefined, undefined, 0, {}, height, this.db);

    }


}

export default InterfaceBlockchainBlockCreator;