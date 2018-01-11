var BigInteger = require('big-integer');
import InterfaceBlockchainBlock from 'common/blockchain/interface-blockchain/blocks/Interface-Blockchain-Block'
import BlockchainGenesis from 'common/blockchain/global/Blockchain-Genesis'
import Serialization from "common/utils/Serialization";
import BufferExtended from "common/utils/BufferExtended";
import WebDollarCryptoData from 'common/crypto/WebDollar-Crypto-Data'
import consts from 'consts/const_global'
const colors = require('colors/safe');

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
        if (prevBlock !== null) {
            for (let i = 0; i < prevBlock.interlink.length; ++i)
                this.interlink[i] = prevBlock.interlink[i];
        }

        let blockLevel = (prevBlock !== null)? prevBlock.getLevel() : 0;

        //add new interlinks for current block
        //Every block of level u needs a pointer to the previous block with level <= u.

        for (let i = 1; i <= blockLevel; ++i){

            if (i > this.interlink.length)
                this.interlink.push({});

            this.interlink[i] = {height: this.height, blockId: prevBlock.hash()}; //getId = Hash

        }

    }
    
    _validateInterlink() {

        if (this.interlink[0].height !== -1 || !this.interlink[0].blockId.equals(BlockchainGenesis.hashPrev)){
            console.log(colors.red("Interlink to Genesis is wrong! "));
            return false;
        }

        for (let i = 1; i < this.interlink.length; ++i){
                let link = this.interlink[i];
                let linkedBlock = this.blockchain.blocks[link.height];
                if (!linkedBlock.hash.equals(link.blockId)){
                    console.log(colors.red("Interlink to Genesis is wrong! "));
                    return false;
                }
        }
        
        //TODO: verify if interlinks points to blocks with highest difficultyTarget

        return true;
    }
    
    async _supplementaryValidation() {
        
        return this._validateInterlink();
    }

    _computeBlockHeaderPrefix(skipPrefix){

        if (skipPrefix === true && Buffer.isBuffer(this.computedBlockPrefix) )
            return this.computedBlockPrefix;

        this.computedBlockPrefix = Buffer.concat ( [
            InterfaceBlockchainBlock.prototype._computeBlockHeaderPrefix.call(this, skipPrefix),
            this._serializeInterlink(),
        ]);

        return this.computedBlockPrefix;

    }
    
    _serializeInterlink(){

        let list = [Serialization.serializeNumber2Bytes(this.interlink.length)];

        for (let i = 0; i < this.interlink.length; ++i) {

            let heightBuffer = Serialization.serializeNumber4Bytes(this.interlink[i].height);
            let blockIdBuffer = this.interlink[i].blockId;
            list.push(heightBuffer);
            list.push(blockIdBuffer);

        }

        return Buffer.concat (list);
    }
    
    _deserializeInterlink(buffer, offset){

        try {

            let numInterlink = Serialization.deserializeNumber( BufferExtended.substr(buffer, offset, 2) );
            offset += 2;

            this.interlink = [];
            for (let i = 0; i < numInterlink; ++i) {

                let height = Serialization.deserializeNumber( BufferExtended.substr(buffer, offset, 4) );
                offset += 4;
                
                let blockId = BufferExtended.substr(buffer, offset, consts.BLOCKS_POW_LENGTH);
                offset += consts.BLOCKS_POW_LENGTH;
                
                this.interlink[i] = {height: height, blockId: blockId};
            }

        } catch (exception){
            console.log("error deserializing interlink. ", exception);
            throw exception;
        }
        
        return offset;
    }
    
    deserializeData(buffer, offset){

        offset = InterfaceBlockchainBlock.prototype.deserializeData.call(this, buffer, offset);

        try {

            offset = this._deserializeInterlink(buffer, offset);

        } catch (exception){

            console.log(colors.red("error deserializing a block  "), exception);
            throw exception;

        }

        return offset;
    }



}

export default PPoWBlockchainBlock;