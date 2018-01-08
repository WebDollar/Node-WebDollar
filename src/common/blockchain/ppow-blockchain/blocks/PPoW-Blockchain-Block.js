var BigInteger = require('big-integer');
import InterfaceBlockchainBlock from 'common/blockchain/interface-blockchain/blocks/Interface-Blockchain-Block'
import BlockchainGenesis from 'common/blockchain/global/Blockchain-Genesis'
import Serialization from "common/utils/Serialization";
import BufferExtended from "common/utils/BufferExtended";
import consts from 'consts/const_global'

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
    
    _deserializeInterlink(buffer){

        let data = WebDollarCryptoData.createWebDollarCryptoData(buffer).buffer;
        let offset = 0;

        try {

            let numInterlink = Serialization.deserializeNumber( BufferExtended.substr(data, offset, 2) );
            offset += 2;
            
            this.interlink = [];
            for (let i = 0; i < numInterlink; ++i) {
                this.interlink[i].height = Serialization.deserializeNumber( BufferExtended.substr(data, offset, 4) );
                offset += 4;
                
                this.interlink[i].blockId = BufferExtended.substr(buffer, offset, consts.BLOCKS_POW_LENGTH);
                offset += consts.BLOCKS_POW_LENGTH;
            }

        } catch (exception){
            console.log("error deserializing interlink. ", exception);
            throw exception;
        }
        
        return offset;
    }
    
    serializeBlock(){

        // serialize block is ( hash + nonce + header + interlink)

        if (!Buffer.isBuffer(this.hash) || this.hash.length !== consts.BLOCKS_POW_LENGTH)
            this.hash = this.computeHash();

        this._computeBlockHeaderPrefix(true);
        let interlink = this._serializeInterlink();

        return Buffer.concat( [
                                  this.hash,
                                  Serialization.serializeNumber4Bytes( this.nonce ),
                                  this.computedBlockPrefix,
                                  
                                ]);

    }

    deserializeBlock(buffer,offset){

        if (!Buffer.isBuffer(buffer))
            buffer = WebDollarCryptoData.createWebDollarCryptoData(buffer).buffer;

        offset = offset||0;

        try {

            this.hash = BufferExtended.substr(buffer, offset, consts.BLOCKS_POW_LENGTH);
            offset += consts.BLOCKS_POW_LENGTH;

            this.nonce = Serialization.deserializeNumber( BufferExtended.substr(buffer, offset, consts.BLOCKS_NONCE) );
            offset += consts.BLOCKS_NONCE;


            this.version = Serialization.deserializeNumber( BufferExtended.substr(buffer, offset, 2) );
            offset += 2;


            this.hashPrev = BufferExtended.substr(buffer, offset, consts.BLOCKS_POW_LENGTH);
            offset += consts.BLOCKS_POW_LENGTH;


            this.timeStamp = Serialization.deserializeNumber( BufferExtended.substr(buffer, offset, 4) );
            offset += 4;

            offset = this.data.deserializeData(buffer, offset);
            
            offset = this._deserializeInterlink(buffer, offset);

        } catch (exception){
            console.log(colors.red("error deserializing a block  "), exception);
            throw exception;
        }

        return offset;

    }

}

export default PPoWBlockchainBlock;