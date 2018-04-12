const BigInteger = require('big-integer');

import consts from 'consts/const_global';
import InterfaceBlockchainBlock from 'common/blockchain/interface-blockchain/blocks/Interface-Blockchain-Block';
import BlockchainGenesis from 'common/blockchain/global/Blockchain-Genesis';
import Convert from 'common/utils/Convert';
import Serialization from "common/utils/Serialization";
import BufferExtended from "common/utils/BufferExtended";
import WebDollarCryptoData from 'common/crypto/WebDollar-Crypto-Data';

class PPoWBlockchainBlock extends InterfaceBlockchainBlock{

    constructor (blockchain, blockValidation, version, hash, hashPrev, timeStamp, nonce, data, height, db) {

        super(blockchain, blockValidation, version, hash, hashPrev, timeStamp, nonce, data, height, db);

        //first pointer is to Genesis
        this.interlink = [{height: -1, blockId: BlockchainGenesis.hashPrev}];
        this.level = 0;
    }

    getLevel(computeLevel = true){

        if (!computeLevel && this.level !== undefined)
            return this.level;

        let T = this.difficultyTarget;

        if (Buffer.isBuffer(T))
            T = Convert.bufferToBigIntegerHex(this.difficultyTarget);

        let id = Convert.bufferToBigIntegerHex(this.hash);
        
        //If id <= T/2^u the block is of level u => block level is max(u) for 2^u * id <= T
        // T -> inf => u -> 255
        let u = 0;
        let pow = new BigInteger("1", 16);

        while(pow.multiply(id).compare(T) <= 0) {
            ++u;
            pow = pow.multiply(2);
        }
        --u;
        console.log('L=', u);
        console.log('P=', id.multiply(1 << u).toString());

        return u;
    }

    /**
     * Algorithm 1
     */
    updateInterlink(prevBlock){

        let blockLevel = 0;
        // interlink = interlink'
        if (prevBlock) {
            for (let i = 0; i < prevBlock.interlink.length; ++i)
                this.interlink[i] = prevBlock.interlink[i];
            blockLevel = prevBlock.getLevel();
        }
        this.level = blockLevel

        //add new interlinks for current block
        //Every block of level u needs a pointer to the previous block with level <= u.

        for (let i = 1; i <= blockLevel; ++i){

            if (i > this.interlink.length)
                this.interlink.push({});

            this.interlink[i] = {height: prevBlock.height, blockId: prevBlock.hash }; //getId = Hash

        }

    }
    
    _validateInterlink() {



        //validate interlinks array
        let level = this.interlink.length-1;
        while (level >= 0){

            let link = this.interlink[level];
            let linkedBlock = this.blockchain.blocks[link.height];

            if (level !== 0) {
                if (! BufferExtended.safeCompare(linkedBlock.hash, link.blockId))
                    throw {message: "Interlink to Genesis is wrong! "};

                let linkedBlockLevel = linkedBlock.getLevel();

                if (linkedBlockLevel < level )
                    throw {message: "Interlink level error", level: level}

                //TODO verify that the interlinks are actually the last on the same level

            } else {

                if (linkedBlock !== undefined || this.interlink[0].height !== -1 || ! BufferExtended.safeCompare(this.interlink[0].blockId, BlockchainGenesis.hashPrev))
                    throw {message: "Interlink to Genesis is wrong! "}

            }

            level--;


        }

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

        for (let i = 0; i < this.interlink.length; i++) {

            //optimize storage
            if (i > 0 && this.interlink[i-1].height === this.interlink[i].height){
                list.push(Serialization.serializeNumber4Bytes(consts.SETTINGS.MAX_UINT32));
            } else {
                let heightBuffer = Serialization.serializeNumber4Bytes(this.interlink[i].height + 1 );
                let blockIdBuffer = this.interlink[i].blockId;
                list.push(heightBuffer);
                list.push(blockIdBuffer);
            }

        }

        return Buffer.concat (list);
    }
    
    _deserializeInterlink(buffer, offset){

        try {

            let numInterlink = Serialization.deserializeNumber( BufferExtended.substr( buffer, offset, 1 ) );
            offset += 1;

            this.interlink = [];
            for (let i = 0; i < numInterlink; ++i) {

                let height = Serialization.deserializeNumber( BufferExtended.substr( buffer, offset, 4 ) );
                offset += 4;

                if (height === consts.SETTINGS.MAX_UINT32) {
                    this.interlink.push(this.interlink[i-1]);
                } else {
                    let blockId = BufferExtended.substr(buffer, offset, 32);
                    offset += 32;

                    this.interlink.push( {height: height - 1, blockId: blockId} );
                }
            }

        } catch (exception){
            console.log("Error deserialize interlink. ", exception);
            throw exception;
        }
        
        return offset;
    }
    
    deserializeBlock(buffer, height, reward, difficultyTarget, offset){


        offset = InterfaceBlockchainBlock.prototype.deserializeBlock.call(this, buffer, height, reward, difficultyTarget, offset);

        try {

            offset = this._deserializeInterlink(buffer, offset);

            this.difficultyTarget = difficultyTarget;

            this.level = this.getLevel();

        } catch (exception){

            console.error("error deserialize a block  ", exception, buffer);
            throw exception;

        }

        return offset;
    }



}

export default PPoWBlockchainBlock;