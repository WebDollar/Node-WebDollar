import InterfaceBlockchainBlock from './Interface-Blockchain-Block'
import BlockchainGenesis from './Blockchain-Genesis'
import InterfaceSatoshminDB from 'common/satoshmindb/Interface-SatoshminDB'
import InterfaceBlockchainBlockData from './Interface-Blockchain-Block-Data'

class InterfaceBlockchainBlockCreator{

    constructor(blockchain, db){

        this.blockchain = blockchain;
        this.db = db;
    }

    /*
        Generate a Genesis Block (no previous block)
     */
    _createBlockGenesis(minerAddress, transactions){

        //validate miner Address

        let data = new InterfaceBlockchainBlockData(this.blockchain, minerAddress, transactions, undefined);

        return new InterfaceBlockchainBlock( this.blockchain,  1, undefined, BlockchainGenesis.hashPrev, undefined, 0, data, 0, this.db );
    }

    /*
        Generate a new block at the end of Blockchain
     */
    _createBlockNew(prevBlock, height, minerAddress, transactions){

        //validate miner Address

        let data = new InterfaceBlockchainBlockData(this.blockchain, minerAddress, transactions, undefined);

        return new InterfaceBlockchainBlock( this.blockchain, 1, undefined, prevBlock.hash, undefined, 0, data, height, this.db);
    }

    createBlockNew(minerAddress, transactions){

        if (this.blockchain.getBlockchainLength() === 0){  //Genesis Block

            return this._createBlockGenesis( minerAddress, transactions );

        } else { //Fetch Transactions and Create Block

            return this._createBlockNew( this.blockchain.getBlockchainLastBlock(), this.blockchain.getBlockchainLength(), minerAddress, transactions  );

        }

    }

    createBlockEmpty(height){

        return new InterfaceBlockchainBlock( 1, undefined, undefined, undefined, 0, null, height, this.db);

    }


}

export default InterfaceBlockchainBlockCreator;