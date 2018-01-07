var BigInteger = require('big-integer');
const colors = require('colors/safe');
import WebDollarCryptoData from 'common/crypto/WebDollar-Crypto-Data'
import WebDollarCrypto from 'common/crypto/WebDollar-Crypto'
import BlockchainGenesis from 'common/blockchain/global/Blockchain-Genesis'
import BlockchainMiningReward from 'common/blockchain/global/Blockchain-Mining-Reward'
import consts from 'consts/const_global'

import InterfaceBlockchainBlockData from './Interface-Blockchain-Block-Data';
import Serialization from "common/utils/Serialization.js";
import BufferExtended from "common/utils/BufferExtended.js";

/*
    Tutorial based on https://en.bitcoin.it/wiki/Block_hashing_algorithm
 */

class InterfaceBlockchainBlock {

    //everything is buffer

    constructor (blockchain, version, hash, hashPrev, timeStamp, nonce, data, height, db){

        this.blockchain = blockchain;

        this.version = version||0; // 2 bytes version                                                 - 2 bytes

        this.hash = hash||null; // 256-bit hash based on all of the transactions in the block     - 32 bytes, sha256

        this.hashPrev = hashPrev||null; // 256-bit hash sha256    l                                         - 32 bytes, sha256



        this.nonce = nonce||0;//	int 2^8^5 number (starts at 0)-  int,                              - 5 bytes
        
        if ( timeStamp === undefined){

            timeStamp = Math.floor( new Date().getTime() / 1000 ) - BlockchainGenesis.timeStamp;
        }

        this.timeStamp = timeStamp||null; //Current timestamp as seconds since 1970-01-01T00:00 UTC        - 4 bytes,


        if (data === undefined || data === null)
            data = this.blockchain.blockCreator.createEmptyBlockData();

        this.data = data;

        
        //computed data
        this.computedBlockPrefix = null;

        this.difficultyTarget = null; // difficulty set by me
        this.height = (typeof height === "number" ? height : null); // index set by me

        this.reward = 0;

        this.db = db;
    }


    async validateBlock(height, previousDifficultyTarget, previousHash, validationType){

        if (this.version === undefined || this.version === null || typeof this.version !== 'number') throw ('version is empty');

        if (this.hash === undefined || this.hash === null || !Buffer.isBuffer(this.hash) ) throw ('hash is empty');
        if (this.hashPrev === undefined || this.hashPrev === null || !Buffer.isBuffer(this.hashPrev) ) throw ('hashPrev is empty');



        if (this.nonce === undefined || this.nonce === null || typeof this.nonce !== 'number') throw ('nonce is empty');
        if (this.timeStamp === undefined || this.timeStamp === null || typeof this.timeStamp !== 'number') throw ('timeStamp is empty');

        //timestamp must be on 4 bytes
        this.timeStamp = Math.floor(this.timeStamp);
        if (this.timeStamp >= 0xFFFFFFFF) throw ('timeStamp is invalid');

        if (height >=0) {

            if (this.version !== 0x01) throw ('invalid version');

        }

        if (height !== this.height) throw 'height is different' + height+ " "+ this.height ;

        await this._validateBlockHash(previousHash, validationType);
        this._validateTargetDifficulty(previousDifficultyTarget);

        if (this.reward.equals(BlockchainMiningReward.getReward(this.height)) === false ) throw 'reward is not right: '+this.reward +' vs '+BlockchainMiningReward.getReward(this.height);

        return true;
    }

    /**
     * it will recheck the validity of the block
     */
    async _validateBlockHash(previousHash, validationType) {

        if (this.computedBlockPrefix === null) this._computeBlockHeaderPrefix(); //making sure that the prefix was calculated for calculating the block

        //validate hashPrev
        if ( previousHash === null || !Buffer.isBuffer(previousHash)) throw 'previous hash is not given'

        if (! previousHash.equals(this.hashPrev)) throw "block prevHash doesn't match";

        //validate hash
        let hash = await this.computeHash();


        if (!hash.equals(this.hash)) throw "block hash is not right ("+this.nonce+")" + this.hash.toString("hex") + " "+ hash.toString("hex") ;

        await this.data.validateBlockData(validationType);

        return true;

    }

    _validateTargetDifficulty(prevDifficultyTarget){


        if (prevDifficultyTarget instanceof BigInteger)
            prevDifficultyTarget = Serialization.serializeToFixedBuffer(consts.BLOCKS_POW_LENGTH, Serialization.serializeBigInteger(prevDifficultyTarget));

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

    _computeBlockHeaderPrefix(skipPrefix){

        //in case I have calculated  the computedBlockPrefix before

        if (skipPrefix === true && Buffer.isBuffer(this.computedBlockPrefix) )
            return this.computedBlockPrefix;

        this.computedBlockPrefix = Buffer.concat ( [
                                                     Serialization.serializeNumber2Bytes( this.version),
                                                     Serialization.serializeToFixedBuffer( consts.BLOCKS_POW_LENGTH , this.hashPrev ),
                                                     Serialization.serializeNumber4Bytes( this.timeStamp ),
                                                     //data contains addressMiner, transactions history, contracts, etc
                                                     this.data.serializeData(),
                                                    ]);

        return this.computedBlockPrefix;
    }


    computeHash(newNonce){

        // hash is hashPow ( block header + nonce )

        let buffer = Buffer.concat ( [
                                       this.computedBlockPrefix,
                                       Serialization.serializeNumber4Bytes(newNonce||this.nonce ),
                                     ] );


        return WebDollarCrypto.hashPOW(buffer);
    }

    serializeBlock(){

        // serialize block is ( hash + nonce + header )

        if (!Buffer.isBuffer(this.hash) || this.hash.length !== consts.BLOCKS_POW_LENGTH)
            this.hash = this.computeHash();

        this._computeBlockHeaderPrefix(true);

        return Buffer.concat( [
                                  this.hash,
                                  Serialization.serializeNumber4Bytes( this.nonce ),
                                  this.computedBlockPrefix,
                                ]);

    }

    deserializeBlock(buffer){

        if (!Buffer.isBuffer(buffer))
            buffer = WebDollarCryptoData.createWebDollarCryptoData(buffer).buffer;

        let offset = 0;

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

            offset = this.data.deserializeData(BufferExtended.substr(buffer, offset));

        } catch (exception){
            console.log(colors.red("error deserializing a block  "), exception);
            throw exception;
        }

        return offset;

    }

    async save(){

        let key = "block" + this.height;
        let bufferValue = this.serializeBlock();
    
        try{
            return (await this.db.save(key, bufferValue));
        }
        catch (err){
            return 'ERROR on SAVE block: ' + err;
        }
    }

    async load(){

        let key = "block" + this.height;
        
        try{

            let buffer = await this.db.get(key);

            if (buffer === null) {
                console.log(colors.red("block "+this.height+" was not found "+ key));
                return false;
            }

            console.log("11111");
            this.deserializeBlock(buffer, this.height);
            console.log("2222");
            //calculate extra parameters
            this.reward = BlockchainMiningReward.getReward(this.height);
            this.difficultyTarget = this.blockchain.getDifficultyTarget();
            console.log("3333");
            return true;
        }
        catch(err) {
            console.log ( 'ERROR on LOAD block: ' + err);
            return false;
        }
    }
    
    async remove() {
        
        let key = "block" + this.height;
        
        try{
            return (await this.db.remove(key));
        }
        catch(err) {
            return 'ERROR on REMOVE block: ' + err;
        }
    }
    
    equals(targetBlock){

        return this.hash.equals(targetBlock.hash) &&
            this.hashPrev.equals(targetBlock.hashPrev) &&
            this.height === targetBlock.height &&
            this.nonce === targetBlock.nonce &&
            this.version === targetBlock.version;
    }

}

export default InterfaceBlockchainBlock;