
import BlockchainGenesis from 'common/blockchain/global/Blockchain-Genesis'
import BufferExtended from "common/utils/BufferExtended";

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
    _createBlockGenesis(blockValidation, minerAddress, args){

        //validate miner Address

        args.unshift ( this.blockchain,  minerAddress, undefined, undefined, undefined );

        let data = new this.blockDataClass(...args);

        return new this.blockClass( this.blockchain,  blockValidation, 1, undefined, BlockchainGenesis.hashPrev, undefined, 0, data, 0, this.db );
    }

    /*
        Generate a new block at the end of Blockchain
     */
    async _createBlockNew(height, blockValidation, minerAddress, transactions, args){

        //validate miner Address

        args.unshift( this.blockchain, minerAddress, transactions, undefined, undefined );
        let data = new this.blockDataClass(...args);

        return new this.blockClass( this.blockchain, blockValidation, 1, undefined, await blockValidation.getHashPrevCallback(height), await blockValidation.getDifficultyCallback(height),  await blockValidation.getChainHashCallback(height), undefined, 0, data, height, this.db);

    }

    createBlockNew(minerAddress, blockValidation, transactions){

        if (!blockValidation )
            blockValidation = this.blockchain.createBlockValidation();

        try {

            if (!Buffer.isBuffer(minerAddress))
                minerAddress = BufferExtended.fromBase(minerAddress);

        } catch (exception){
            console.log("error creating a new block invalid minerAddress",  minerAddress, exception);
        }

        let restArgs = [];
        for (let i=2; i<arguments.length; i++ )
            restArgs.push(arguments[i]);

        if (this.blockchain.blocks.length === 0){  //Genesis Block

            return this._createBlockGenesis( blockValidation, minerAddress, restArgs);

        } else { //Fetch Transactions and Create Block

            return this._createBlockNew( this.blockchain.blocks.length, blockValidation, minerAddress, transactions, restArgs );

        }

    }

    async createEmptyBlock(height, blockValidation){

        return new this.blockClass(this.blockchain, blockValidation,      1, undefined, await blockValidation.getHashPrevCallback(height), await blockValidation.getDifficultyCallback(height),  await blockValidation.getChainHashCallback(height), undefined,  0,       null, height, this.db);

    }

    createEmptyBlockData(){

        return new this.blockDataClass(this.blockchain);

    }


}

export default InterfaceBlockchainBlockCreator;