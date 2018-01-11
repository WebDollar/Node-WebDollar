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

        let T = this.difficultyTarget;
        let id = new BigInteger(this.hash.toString('hex'), 16);
        
        //If id <= T/2^u the block is of level u => block level is max(u) for 2^u * id <= T
        // T -> inf => u -> 255
        let u = 0;
        let pow = new BigInteger("1", 16);

        console.log('I=', id.toString());
        console.log('T=', T.toString());

        while(pow.multiply(id).compare(T) <= 0) {
            ++u;
            pow = pow.multiply(2);
        }
        --u;
        console.log('L=', u);
        console.log('P=', id.multiply(1 << u).toString());

        return u;
    }
    
    updateInterlink(prevBlock){
        
        let blockLevel = 0;
        // interlink = interlink'
        if (prevBlock) {
            for (let i = 0; i < prevBlock.interlink.length; ++i)
                this.interlink[i] = prevBlock.interlink[i];
            blockLevel = prevBlock.getLevel();
        }

        //add new interlinks for current block
        //Every block of level u needs a pointer to the previous block with level <= u.

        for (let i = 1; i <= blockLevel; ++i){

            if (i > this.interlink.length)
                this.interlink.push({});

            this.interlink[i] = {height: this.height, blockId: prevBlock.hash }; //getId = Hash

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
            InterfaceBlockchainBlock.prototype._computeBlockHeaderPrefix.call(this, false),
            this._serializeInterlink(),
        ]);

        return this.computedBlockPrefix;

    }
    
    _serializeInterlink(){

        let list = [Serialization.serializeNumber1Byte(this.interlink.length)];

        for (let i = 0; i < this.interlink.length; ++i) {

            let heightBuffer = Serialization.serializeNumber4Bytes(this.interlink[i].height+1);
            let blockIdBuffer = this.interlink[i].blockId;
            list.push(heightBuffer);
            list.push(blockIdBuffer);

        }

        return Buffer.concat (list);
    }
    
    _deserializeInterlink(buffer, offset){

        try {


            console.log("offset", offset);

            let numInterlink = Serialization.deserializeNumber( BufferExtended.substr( buffer, offset, 1 ) );
            offset += 1;

            console.log("_deserializeInterlink 1", numInterlink)

            this.interlink = [];
            for (let i = 0; i < numInterlink; ++i) {

                console.log("_deserializeInterlink 2")
                let height = Serialization.deserializeNumber( BufferExtended.substr( buffer, offset, 4 ) );
                offset += 4;

                console.log("_deserializeInterlink 3")
                let blockId = BufferExtended.substr(buffer, offset, 32);
                offset += 32;
                
                this.interlink.push (  {height: height-1, blockId: blockId} );
            }

        } catch (exception){
            console.log("error deserializing interlink. ", exception);
            throw exception;
        }
        
        return offset;
    }
    
    deserializeBlock(buffer, offset){


        offset = InterfaceBlockchainBlock.prototype.deserializeBlock.call(this, buffer, undefined, undefined, undefined, offset);

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