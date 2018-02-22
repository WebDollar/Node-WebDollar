var BigInteger = require('big-integer');
const colors = require('colors/safe');
import WebDollarCryptoData from 'common/crypto/WebDollar-Crypto-Data'
import WebDollarCrypto from 'common/crypto/WebDollar-Crypto'
import BlockchainGenesis from 'common/blockchain/global/Blockchain-Genesis'
import BlockchainMiningReward from 'common/blockchain/global/Blockchain-Mining-Reward'
import consts from 'consts/const_global'

import Serialization from "common/utils/Serialization";
import BufferExtended from "common/utils/BufferExtended";

/*
    Tutorial based on https://en.bitcoin.it/wiki/Block_hashing_algorithm
 */

class InterfaceBlockchainBlock {

    //everything is buffer

    constructor (blockchain, blockValidation, version, hash, hashPrev, timeStamp, nonce, data, height, db){

        this.blockchain = blockchain;

        this.version = version||0; // 2 bytes version                                                 - 2 bytes

        this.hash = hash||null; // 256-bit hash based on all of the transactions in the block     - 32 bytes, sha256

        this.hashPrev = hashPrev||null; // 256-bit hash sha256    l                                         - 32 bytes, sha256

        this.nonce = nonce||0;//	int 2^8^5 number (starts at 0)-  int,                              - 5 bytes
        
        if ( timeStamp === undefined)
            timeStamp = this.blockchain.timestamp.timeUTCNetworkAdjustedTime - BlockchainGenesis.timeStampOffset;

        this.timeStamp = timeStamp||null; //Current timestamp as seconds since 1970-01-01T00:00 UTC        - 4 bytes,


        if (data === undefined || data === null)
            data = this.blockchain.blockCreator.createEmptyBlockData();

        this.data = data;

        
        //computed data
        this.computedBlockPrefix = null;

        this.difficultyTarget = null; // difficulty set by Blockchain
        this.difficultyTargetPrev = null; // difficulty set by Blockchain
        this.height = (typeof height === "number" ? height : null); // index set by me

        this.reward = undefined;

        this.blockValidation = blockValidation;

        this.db = db;

    }

    async _supplementaryValidation() {
        return true;
    }

    async validateBlock(height){

        if (typeof this.version !== 'number') throw ('version is empty');

        if (this.hash === undefined || this.hash === null || !Buffer.isBuffer(this.hash) ) throw ('hash is empty');
        if (this.hashPrev === undefined || this.hashPrev === null || !Buffer.isBuffer(this.hashPrev) ) throw ('hashPrev is empty');



        if (typeof this.nonce !== 'number') throw ('nonce is empty');
        if (typeof this.timeStamp !== 'number') throw ('timeStamp is empty');

        //timestamp must be on 4 bytes
        if (this.timeStamp >= 0xFFFFFFFF) throw ('timeStamp is invalid');

        if (height >=0)
            if (this.version !== 0x01) throw ('invalid version '+this.version);

        if (height !== this.height) throw 'height is different' + height+ " "+ this.height ;

        if (! (await this._validateBlockHash())) throw "validateBlockchain return false";

        this._validateTargetDifficulty();

        if (this.reward.equals( BlockchainMiningReward.getReward(this.height) ) === false )
            throw 'reward is not right: '+this.reward +' vs '+BlockchainMiningReward.getReward( this.height );

        if (this._supplementaryValidation() === false) throw "supplementaryValidation failed";

        return true;
    }

    /**
     * it will recheck the validity of the block
     */
    async _validateBlockHash() {

        if (this.computedBlockPrefix === null) this._computeBlockHeaderPrefix(); //making sure that the prefix was calculated for calculating the block

        if ( this.blockValidation.blockValidationType["skip-prev-hash-validation"] === undefined ){

            //validate hashPrev
            let previousHash = this.blockValidation.getHashPrevCallback(this.height);
            if ( previousHash === null || !Buffer.isBuffer(previousHash)) throw 'previous hash is not given'

            if (! previousHash.equals(this.hashPrev)) throw "block prevHash doesn't match " + previousHash.toString("hex") + " " + this.hashPrev.toString("hex") ;
        }

        //validate hash
        //skip the validation, if the blockValidationType is provided
        if ( !this.blockValidation.blockValidationType['skip-validation']) {

            console.log("_validateBlockHash");

            let hash = await this.computeHash();

            if (!hash.equals(this.hash)) throw "block hash is not right (" + this.nonce + ")" + this.hash.toString("hex") + " " + hash.toString("hex") + "    " + "difficultyTargetPrev" + this.difficultyTargetPrev.toString("hex")+ "    "+ Buffer.concat([this.computedBlockPrefix, Serialization.serializeNumber4Bytes(this.nonce)]).toString("hex");

        }

        await this.data.validateBlockData(this.height, this.blockValidation);

        return true;

    }

    _validateTargetDifficulty(){


        let prevDifficultyTarget = this.blockValidation.getDifficultyCallback(this.height);

        if (prevDifficultyTarget instanceof BigInteger)
            prevDifficultyTarget = Serialization.serializeToFixedBuffer(consts.BLOCKCHAIN.BLOCKS_POW_LENGTH, Serialization.serializeBigInteger(prevDifficultyTarget));

        if ( prevDifficultyTarget === null || !Buffer.isBuffer(prevDifficultyTarget)) throw 'previousDifficultyTarget is not given'

        //console.log("difficulty block",this.height, "diff", prevDifficultyTarget.toString("hex"), "hash", this.hash.toString("hex"));

        if (! (this.hash.compare( prevDifficultyTarget ) <= 0))
            throw "block doesn't match the difficulty target is not ";

        return true;
    }

    toString(){

        return this.hashPrev.toString() + this.data.toString();

    }

    toJSON(){

        return {
            version: this.version,
            hashPrev: this.hashPrev,
            data: this.data.toJSON(),
            nonce: this.nonce,
            timeStamp: this.timeStamp,
        }

    }

    /*
        Concat of Hashes to avoid double computation
     */

    _computeBlockHeaderPrefix(skipPrefix, requestHeader){

        //in case I have calculated  the computedBlockPrefix before

        if (skipPrefix === true && Buffer.isBuffer(this.computedBlockPrefix) )
            return this.computedBlockPrefix;

        this.computedBlockPrefix = Buffer.concat ( [
                                                     Serialization.serializeNumber2Bytes( this.version),
                                                     Serialization.serializeToFixedBuffer( consts.BLOCKCHAIN.BLOCKS_POW_LENGTH , this.hashPrev ),
                                                     Serialization.serializeNumber4Bytes( this.timeStamp ),
                                                     //data contains addressMiner, transactions history, contracts, etc
                                                     this.data.serializeData(requestHeader),
                                                    ]);

        return this.computedBlockPrefix;
    }


    async computeHash(newNonce){

        // hash is hashPow ( block header + nonce )

        let buffer = Buffer.concat ( [
                                       Serialization.serializeBufferRemovingLeadingZeros( Serialization.serializeNumber4Bytes(this.height) ),
                                       Serialization.serializeBufferRemovingLeadingZeros( this.difficultyTargetPrev ),
                                       this.computedBlockPrefix,
                                       Serialization.serializeNumber4Bytes(newNonce||this.nonce ),
                                     ] );

        return  await WebDollarCrypto.hashPOW(buffer);
    }

    serializeBlock(requestHeader){

        // serialize block is ( hash + nonce + header )

        this._computeBlockHeaderPrefix(true, requestHeader);

        if (!Buffer.isBuffer(this.hash) || this.hash.length !== consts.BLOCKCHAIN.BLOCKS_POW_LENGTH)
            this.hash = this.computeHash();

        return Buffer.concat( [
                                  this.hash,
                                  Serialization.serializeNumber4Bytes( this.nonce ),
                                  this.computedBlockPrefix,
                                ]);

    }

    deserializeBlock(buffer, height, reward, difficultyTarget, offset){

        if (!Buffer.isBuffer(buffer))
            buffer = WebDollarCryptoData.createWebDollarCryptoData(buffer).buffer;

        if (height !== undefined) this.height = height;
        if (reward !== undefined) this.reward = reward;
        if (difficultyTarget !== undefined) this.difficultyTarget= difficultyTarget;

        if (offset === undefined) offset = 0;

        try {

            this.hash = BufferExtended.substr(buffer, offset, consts.BLOCKCHAIN.BLOCKS_POW_LENGTH);
            offset += consts.BLOCKCHAIN.BLOCKS_POW_LENGTH;

            this.nonce = Serialization.deserializeNumber( BufferExtended.substr(buffer, offset, consts.BLOCKCHAIN.BLOCKS_NONCE) );
            offset += consts.BLOCKCHAIN.BLOCKS_NONCE;


            this.version = Serialization.deserializeNumber( BufferExtended.substr(buffer, offset, 2) );
            offset += 2;

            this.hashPrev = BufferExtended.substr(buffer, offset, consts.BLOCKCHAIN.BLOCKS_POW_LENGTH);
            offset += consts.BLOCKCHAIN.BLOCKS_POW_LENGTH;


            this.timeStamp = Serialization.deserializeNumber( BufferExtended.substr(buffer, offset, 4) );
            offset += 4;

            offset = this.data.deserializeData(buffer, offset);

        } catch (exception){
            console.error("error deserializing a block  ", exception, buffer);
            throw exception;
        }

        return offset;

    }

    async saveBlock(){

        let key = "block" + this.height;

        let bufferValue;

        try {
            bufferValue = this.serializeBlock();
        } catch (exception){
            console.error('ERROR serializing block: ',  exception);
            throw exception;
        }
    
        try{
            return (await this.db.save(key, bufferValue));
        }
        catch (exception){
            console.error('ERROR on SAVE block: ',  exception);
            throw exception;
        }
    }

    async loadBlock(){

        let key = "block" + this.height;
        console.log("block load", key);

        try{

            let buffer = await this.db.get(key);

            if (buffer === null) {
                console.error("block "+this.height+" was not found "+ key);
                return false;
            }

            this.deserializeBlock(buffer, this.height, BlockchainMiningReward.getReward(this.height), this.blockchain.getDifficultyTarget() );

            return true;
        }
        catch(exception) {
            console.error( 'ERROR on LOAD block: ', exception);
            return false;
        }
    }
    
    async removeBlock() {
        
        let key = "block" + this.height;
        
        try{
            return (await this.db.remove(key));
        }
        catch(exception) {
            return 'ERROR on REMOVE block: ' + exception;
        }
    }
    
    equals(targetBlock){

        return this.hash.equals(targetBlock.hash) &&
            this.hashPrev.equals(targetBlock.hashPrev) &&
            this.height === targetBlock.height &&
            this.nonce === targetBlock.nonce &&
            this.version === targetBlock.version;
    }

    getBlockHeader(){

        return {
            height: this.height,
            chainLength: this.blockchain.blocks.length,
            header: {
                hash: this.hash,
                hashPrev: this.hashPrev,
                data: {
                    hashData: this.data.hashData,
                    hashTransactions: this.data.hashTransactions,
                },

                nonce: this.nonce,
            }

        }
    }

}

export default InterfaceBlockchainBlock;