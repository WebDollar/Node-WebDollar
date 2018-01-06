var BigInteger = require('big-integer');
import InterfaceBlockchainBlock from 'common/blockchain/interface-blockchain/blocks/Interface-Blockchain-Block'
import BlockchainGenesis from 'common/blockchain/global/Blockchain-Genesis'

class PPoWBlockchainBlock extends InterfaceBlockchainBlock{

    constructor (blockchain, version, hash, hashPrev, timeStamp, nonce, data, height, db) {

        super(blockchain, version, hash, hashPrev, timeStamp, nonce, data, height, db);

        //first pointer is to Genesis
        this.interlink = [{height: -1, blockId: BlockchainGenesis.hashPrev}];
    }


    getId(){

        return this.hash;
    }

    getLevel(){

        let T = new BigInteger(this.difficultyTarget.toString('hex'), 32);
        let id = new BigInteger(this.getId().toString('hex'), 32);
        
        //If id <= T/2^u the block is of level u => block level is max(u) for 2^u * id <= T
        let u = 0;
        let pow = new BigInteger(1, 32);

        while(pow.mul(id).compare(T) <= 0) {
            ++u;
            pow = pow.mul(2);
        }
        --u;

        return u;
    }
    
    updateInterlink(prevBlock){
        
        for (let i = 0; i < prevBlock.interlink.length; ++i){
            this.interlink[i] = prevBlock.interlink[i];
        }
        
        let blockLevel = this.getLevel();

        //add new interlinks for current block
        //Every block of level u needs a pointer to the previous block with level <= u.
        for (let i = 1; i <= blockLevel; ++i){
            if (i > this.interlink.length){
                this.interlink.push( {height: this.height, blockId: this.getId()} );
            }
            let height = this.interlink[i].height;
            //for each interlink modification of a block the block.hash will be modified
            let id = this.blockchain[height].getId();
            this.interlink[i] = {height: height, blockId: id};
        }

    }

}

export default PPoWBlockchainBlock;