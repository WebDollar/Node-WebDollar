var BigInteger = require('big-integer');
import InterfaceBlockchainBlock from 'common/blockchain/interface-blockchain/blocks/Interface-Blockchain-Block'
import BlockchainGenesis from 'common/blockchain/global/Blockchain-Genesis'

class PPoWBlockchainBlock extends InterfaceBlockchainBlock{

    constructor (blockchain, version, hash, hashPrev, timeStamp, nonce, data, height, db) {

        super(blockchain, version, hash, hashPrev, timeStamp, nonce, data, height, db);

        //first pointer is to Genesis
        this.interlink = [{height: -1, blockId: BlockchainGenesis.hashPrev}];
    }

    getLevel(){

        let T = new BigInteger(this.difficultyTarget.toString('hex'), 32);
        let id = new BigInteger(this.hash.toString('hex'), 32);
        
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

        // interlink = interlink'
        for (let i = 0; i < prevBlock.interlink.length; ++i)
            this.interlink[i] = prevBlock.interlink[i];
        
        let blockLevel = prevBlock.getLevel();

        //add new interlinks for current block
        //Every block of level u needs a pointer to the previous block with level <= u.

        for (let i = 1; i <= blockLevel; ++i){

            if (i > this.interlink.length)
                this.interlink.push({});

            this.interlink[i] = {height: this.height, blockId: prevBlock.hash()}; //getId = Hash

        }

    }

}

export default PPoWBlockchainBlock;