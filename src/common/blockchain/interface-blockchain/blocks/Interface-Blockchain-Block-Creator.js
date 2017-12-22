import InterfaceBlockchainBlock from './Interface-Blockchain-Block'
import BlockchainGenesis from './Blockchain-Genesis'
import InterfaceBlockchainBlockData from './Interface-Blockchain-Block-Data'
import InterfacePouchDB from 'common/pouchdb/Interface-PouchDB'

class InterfaceBlockchainBlockCreator{

    constructor(blockchain){

        this.blockchain = blockchain;
        this.db = new InterfacePouchDB();
    }

    /*
        Generate a Genesis Block (no previous block)
     */
    _createBlockGenesis(minerAddress, transactions){

        //validate miner Address

        let data = InterfaceBlockchainBlockData(minerAddress, transactions, undefined);

        return new InterfaceBlockchainBlock( 1, undefined, BlockchainGenesis.hashPrev, undefined, 0, data, 0, this.db );
    }

    /*
        Generate a new block at the end of Blockchain
     */
    _createBlockNew(prevBlock, height, minerAddress, transactions){

        //validate miner Address

        let data = InterfaceBlockchainBlockData(minerAddress, transactions, undefined);

        return new InterfaceBlockchainBlock( 1, undefined, prevBlock.hash, undefined, 0, data, height, this.db);
    }

    createBlockNew(minerAddress, transactions){

        if (this.blockchain.getBlockchainLength() === 0){  //Genesis Block

            return this._createBlockGenesis( minerAddress, transactions );

        } else { //Fetch Transactions and Create Block

            return this._createBlockNew( this.blockchain.getBlockchainLastBlock(), this.blockchain.getBlockchainLength(), minerAddress, transactions  );

        }

    }

    createBlockEmpty(height){

        return new InterfaceBlockchainBlock( 1, undefined, undefined, undefined, 0, {}, height, this.db);

    }


}

export default InterfaceBlockchainBlockCreator;