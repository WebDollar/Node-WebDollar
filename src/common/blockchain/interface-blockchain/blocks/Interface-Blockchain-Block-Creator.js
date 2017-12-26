
import BlockchainGenesis from 'common/blockchain/global/Blockchain-Genesis'

class InterfaceBlockchainBlockCreator{

    constructor(blockchain, db, blockClass, blockDataClass ){

        this.blockClass = blockClass;
        this.blockDataClass = blockDataClass;

        this.blockchain = blockchain;
        this.db = db;
    }

    /*
        Generate a Genesis Block (no previous block)
     */
    _createBlockGenesis(minerAddress, args){

        //validate miner Address

        args.unshift (  this.blockchain, minerAddress, undefined, undefined );

        let data = new this.blockDataClass(...args);

        return new this.blockClass( this.blockchain,  1, undefined, BlockchainGenesis.hashPrev, undefined, 0, data, 0, this.db );
    }

    /*
        Generate a new block at the end of Blockchain
     */
    _createBlockNew(prevBlock, height, minerAddress, transactions, args){

        //validate miner Address

        args.unshift( this.blockchain, minerAddress, transactions, undefined );
        let data = new this.blockDataClass(...args);

        return new this.blockClass( this.blockchain, 1, undefined, prevBlock.hash, undefined, 0, data, height, this.db);
    }

    createBlockNew(minerAddress, transactions){

        let restArgs = [];
        for (let i=2; i<arguments.length; i++ )
            restArgs.push(arguments[i])

        if (this.blockchain.getBlockchainLength() === 0){  //Genesis Block

            return this._createBlockGenesis( minerAddress, restArgs);

        } else { //Fetch Transactions and Create Block

            return this._createBlockNew( this.blockchain.getBlockchainLastBlock(), this.blockchain.getBlockchainLength(), minerAddress, transactions, restArgs );

        }

    }

    createEmptyBlock(height){

        return new this.blockClass(this.blockchain, 1, undefined, undefined, undefined, 0, null, height, this.db);

    }

    createEmptyBlockData(){

        return new this.blockDataClass(this.blockchain);
    }


}

export default InterfaceBlockchainBlockCreator;