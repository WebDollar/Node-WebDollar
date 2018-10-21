const BigInteger = require('big-integer');
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

        this.height = (typeof height === "number" ? height : null); // index set by me

        if (blockValidation === undefined)
            blockValidation = this.blockchain.createBlockValidation();

        this.blockValidation = blockValidation;

        if ( timeStamp === undefined  || timeStamp === null) {

            timeStamp = this.blockchain.timestamp.networkAdjustedTime - BlockchainGenesis.timeStampOffset;

            if (timeStamp === undefined || timeStamp === null)
                timeStamp = ( new Date().getTime() - BlockchainGenesis.timeStampOffset) / 1000;

            timeStamp += Math.floor( Math.random()*5   );

            try {

                this.blockchain.blocks.timestampBlocks.validateMedianTimestamp( timeStamp, this.height, this.blockValidation );

            } catch (exception){
                timeStamp = exception.medianTimestamp + 1;

                this.blockchain.blocks.timestampBlocks.validateMedianTimestamp( timeStamp, this.height, this.blockValidation );

                //timeStamp = exception.medianTimestamp + consts.BLOCKCHAIN.DIFFICULTY.TIME_PER_BLOCK + 1;
            }

            
            timeStamp = Math.ceil( timeStamp );
        }

        this.timeStamp = timeStamp||null; //Current timestamp as seconds since 1970-01-01T00:00 UTC        - 4 bytes,

        if (data === undefined || data === null)
            data = this.blockchain.blockCreator.createEmptyBlockData();

        this.data = data;

        
        //computed data
        this.computedSerialization = undefined;

        this.difficultyTarget = null; // difficulty set by Blockchain
        this.difficultyTargetPrev = null; // difficulty set by Blockchain

        this.reward = undefined;

        this.db = db;

        this._socketPropagatedBy = undefined;

        this._workDone = undefined;

    }

    destroyBlock(){

        if (this.blockchain === undefined) return;

        //it is included in the blockchain
        if ( this.blockchain.blocks[ this.height ] === this)
            return;

        this.blockchain = undefined;

        if (this.data !== undefined && this.data !== null)
            this.data.destroyBlockData();

        this.db = undefined;
        delete this.data;

        if (this.blockValidation !== undefined && this.blockValidation !== null)
            this.blockValidation.destroyBlockValidation();

        this.blockValidation = undefined;
    }

    async _supplementaryValidation() {
        return true;
    }

    async validateBlock( height ){

        if (typeof this.version !== 'number') throw {message: 'version is empty'};
        if (typeof this.nonce !== 'number') throw {message: 'nonce is empty'};
        if (typeof this.timeStamp !== 'number') throw {message: 'timeStamp is empty'};

        if (this.hash === undefined || this.hash === null || !Buffer.isBuffer(this.hash) ) throw {message: 'hash is empty'};
        if (this.hashPrev === undefined || this.hashPrev === null || !Buffer.isBuffer(this.hashPrev) ) throw {message: 'hashPrev is empty'};

        //timestamp must be on 4 bytes
        if (this.timeStamp < 0 || this.timeStamp >= 0xFFFFFFFF) throw {message: 'timeStamp is invalid'};

        if (height >= 0) {
            if (this.version !== consts.TRANSACTIONS.VERSIONS.SCHNORR_VERSION) throw {message: 'invalid version ', version: this.version};
        }

        if (height !== this.height)
            throw {message: 'height is different', height: height, myHeight: this.height};

        if ( ! (await this._validateBlockHash()) )
            throw {message: "validateBlockchain returned false"};

        this._validateTargetDifficulty();

        this._validateBlockTimeStamp();

        if (this.reward !== BlockchainMiningReward.getReward(this.height) )
            throw {message: 'reward is not right: ', myReward: this.reward, reward: BlockchainMiningReward.getReward( this.height ) };

        if (this._supplementaryValidation() === false)
            throw {message: "supplementaryValidation failed"};

        return true;
    }

    /**
     * it will recheck the validity of the block
     */
    async _validateBlockHash() {

        if ( ! this.blockValidation.blockValidationType["skip-prev-hash-validation"] ){

            //validate hashPrev
            let previousHash = this.blockValidation.getHashPrevCallback(this.height);
            if ( previousHash === null || !Buffer.isBuffer(previousHash))
                throw {message: 'previous hash is not given'};

            if (! BufferExtended.safeCompare(previousHash, this.hashPrev))
                throw {message: "block prevHash doesn't match ", prevHash: previousHash.toString("hex"), hashPrev: this.hashPrev.toString("hex")};
        }

        //validate hash
        //skip the validation, if the blockValidationType is provided
        if (!this.blockValidation.blockValidationType['skip-validation-PoW-hash']) {

            let hash = await this.computeHash();

            if (! BufferExtended.safeCompare(hash, this.hash))
                throw {message: "block hash is not right", nonce: this.nonce, height: this.height, myHash:this.hash.toString("hex"), hash:hash.toString("hex"),
                       difficultyTargetPrev: this.difficultyTargetPrev.toString("hex"), serialization: Buffer.concat( [this._computeBlockHeaderPrefix(), Serialization.serializeNumber4Bytes(this.nonce)] ).toString("hex")};

        }

        await this.data.validateBlockData(this.height, this.blockValidation);

        return true;

    }

    _validateTargetDifficulty(){

        if (!this.blockValidation.blockValidationType['skip-target-difficulty-validation']){

            let prevDifficultyTarget = this.blockValidation.getDifficultyCallback(this.height);

            if (prevDifficultyTarget instanceof BigInteger)
                prevDifficultyTarget = Serialization.serializeToFixedBuffer(consts.BLOCKCHAIN.BLOCKS_POW_LENGTH, Serialization.serializeBigInteger(prevDifficultyTarget));

            if ( prevDifficultyTarget === null || !Buffer.isBuffer(prevDifficultyTarget) )
                throw {message: 'previousDifficultyTarget is not given'};

            if (! (this.hash.compare( prevDifficultyTarget ) <= 0))
                throw {message: "block doesn't match the difficulty target is not ", hash:this.hash, prevDifficultyTarget: prevDifficultyTarget};


        }


        return true;
    }



    _validateBlockTimeStamp(){

        // BITCOIN: A timestamp is accepted as valid if it is greater than the median timestamp of previous 11 blocks, and less than the network-adjusted time + 2 hours.

        if ( ! this.blockValidation.blockValidationType['skip-validation-timestamp'] && this.height > consts.BLOCKCHAIN.TIMESTAMP.VALIDATION_NO_BLOCKS + 1 )
            this.blockchain.blocks.timestampBlocks.validateMedianTimestamp(this.timeStamp, this.height, this.blockValidation);


        this.blockchain.blocks.timestampBlocks.validateNetworkAdjustedTime(this.timeStamp, this.height);

    }

    toString(){
        return this.hashPrev.toString() + this.data.toString();
    }

    toJSON(){

        return {
            height: this.height,
            version: this.version,
            hashPrev: (this.hashPrev !== null ? this.hashPrev.toString("hex") : ''),
            data: (this.data !== null ? this.data.toJSON() : ''),
            nonce: this.nonce,
            timeStamp: this.timeStamp,
            difficulty: (this.difficultyTarget !== null ? this.difficultyTarget.toString("hex") : ''),
        }

    }

    /*
        Concat of Hashes to avoid double computation
     */

    _computeBlockHeaderPrefix( requestHeader = false ){

        if (this.height < consts.BLOCKCHAIN.HARD_FORKS.TRANSACTIONS_INCLUDING_ONLY_HEADER && requestHeader )
            requestHeader = false;

        return Buffer.concat ( [
                                  Serialization.serializeNumber2Bytes( this.version),
                                  Serialization.serializeToFixedBuffer( consts.BLOCKCHAIN.BLOCKS_POW_LENGTH , this.hashPrev ),
                                  Serialization.serializeNumber4Bytes( this.timeStamp ),
                                  //data contains addressMiner, transactions history, contracts, etc
                                  this.data.serializeData(requestHeader),

                               ]);
    }


    /**
     * Computes block's hash
     * @param newNonce
     * @returns {Promise<Buffer>}
     */
    computeHash(newNonce){

        return this.computeHashPOW(newNonce);

    }

    _getHashPOWData(newNonce){
        return Buffer.concat([
            Serialization.serializeBufferRemovingLeadingZeros( Serialization.serializeNumber4Bytes(this.height) ),
            Serialization.serializeBufferRemovingLeadingZeros( this.difficultyTargetPrev),
            this._computeBlockHeaderPrefix( true ),
            Serialization.serializeNumber4Bytes(newNonce || this.nonce),
        ]);
    }

    async computeHashPOW(newNonce){

        try {

            // hash is hashPow ( block header + nonce )

            return await WebDollarCrypto.hashPOW( this._getHashPOWData(newNonce) );

        } catch (exception){
            console.error("Error computeHash", exception);
            //return Buffer.from( consts.BLOCKCHAIN.BLOCKS_MAX_TARGET_BUFFER);
            throw exception;
        }
    }




    /**
     * Computes a hash based on static block data
     * @param newNonce
     * @param height
     * @param difficultyTargetPrev
     * @param computedBlockPrefix
     * @param blockNonce
     * @returns {Promise<Buffer>}
     */
    static async computeHashStatic(blockSerialized, newNonce) {

        let buffer = Buffer.concat ( [
            blockSerialized,
            Serialization.serializeNumber4Bytes(newNonce),
        ] );

        return await WebDollarCrypto.hashPOW( buffer );
    }

    _calculateSerializedBlock(requestHeader = false){

        return Buffer.concat( [

            this.hash,
            Serialization.serializeNumber4Bytes( this.nonce ),
            this._computeBlockHeaderPrefix(requestHeader),

        ]);

    }

    serializeBlock( requestHeader = false ){

        // serialize block is ( hash + nonce + header )

        if (!Buffer.isBuffer(this.hash) || this.hash.length !== consts.BLOCKCHAIN.BLOCKS_POW_LENGTH)
            this.hash = this.computeHash();

        let data = this._calculateSerializedBlock(requestHeader);

        return data;

    }

    _deserializeBlock(buffer, offset = 0){


        this.hash = BufferExtended.substr(buffer, offset, consts.BLOCKCHAIN.BLOCKS_POW_LENGTH);
        offset += consts.BLOCKCHAIN.BLOCKS_POW_LENGTH;

        this.nonce = Serialization.deserializeNumber4Bytes(buffer, offset,);
        offset += 4;

        return offset;

    }

    deserializeBlock(buffer, height, reward, difficultyTargetPrev, offset = 0, blockLengthValidation = true){

        if (!Buffer.isBuffer(buffer) && typeof buffer === "string")
            buffer = new Buffer(buffer, "hex");

        if (height !== undefined)  this.height = height;
        if (reward !== undefined) this.reward = reward;
        else if (this.reward === undefined) this.reward = BlockchainMiningReward.getReward(height||this.height);

        if (difficultyTargetPrev !== undefined) this.difficultyTargetPrev = difficultyTargetPrev;

        if ( blockLengthValidation && (buffer.length - offset) > consts.SETTINGS.PARAMS.MAX_SIZE.BLOCKS_MAX_SIZE_BYTES )
            throw {message: "Block Size is bigger than the MAX_SIZE.BLOCKS_MAX_SIZE_BYTES", bufferLength: buffer.length };

        try {

            offset = this._deserializeBlock(buffer, offset);

            //TODO 1 byte version
            this.version = Serialization.deserializeNumber2Bytes( buffer, offset );
            offset += 2;

            //TODO  put hashPrev into block.data
            this.hashPrev = BufferExtended.substr(buffer, offset, consts.BLOCKCHAIN.BLOCKS_POW_LENGTH);
            offset += consts.BLOCKCHAIN.BLOCKS_POW_LENGTH;


            this.timeStamp = Serialization.deserializeNumber4Bytes( buffer, offset);
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
            bufferValue = await this.serializeBlock(false);
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

        try{

            let buffer = await this.db.get(key, 12000);

            if (buffer === null) {
                console.error("block "+this.height+" was not found "+ key);
                return false;
            }

            this.deserializeBlock(buffer, this.height, undefined, this.blockValidation.getDifficultyCallback(this.height) );

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

        return BufferExtended.safeCompare(this.hash, targetBlock.hash) &&
            this.height === targetBlock.height &&
            this.nonce === targetBlock.nonce &&
            this.version === targetBlock.version;
    }

    getBlockHeaderWithInformation(){

        return {

            height: this.height,
            chainLength: this.blockchain.blocks.length,
            chainStartingPoint: this.blockchain.blocks.blocksStartingPoint,

            header: this.getBlockHeader(),
        }

    }

    getBlockHeader(){

        return {

            version: this.version,
            height: this.height,
            hash: this.hash,
            hashPrev: this.hashPrev,
            data: {
                hashData: this.data.hashData,
            },
            nonce: this.nonce,
            timeStamp: this.timeStamp,
            difficultyTargetPrev: this.difficultyTargetPrev,
        }

    }

    async importBlockFromHeader(json) {

        this.height = json.height;
        this.hash = json.hash;
        this.hashPrev = json.hashPrev;
        this.data.hashData = json.data.hashData;
        this.nonce = json.nonce;

        this.version = json.version;
        this.timeStamp = json.timeStamp;
        this.difficultyTargetPrev = json.difficultyTargetPrev;

        //calculate Hash
        this._computeBlockHeaderPrefix( true );
        await this.computeHash();
    }

    get socketPropagatedBy(){
        return this._socketPropagatedBy;
    }

    set socketPropagatedBy(socket){

        this._socketPropagatedBy = socket;

        socket.on("disconnect",()=>{
           this._socketPropagatedBy = undefined;
        });

    }

    /**
     *
     */
    get workDone(){

        if (this._workDone !== undefined) return this._workDone;

        this._workDone = consts.BLOCKCHAIN.BLOCKS_MAX_TARGET_BIG_INTEGER.divide( new BigInteger( this.difficultyTargetPrev.toString("hex"), 16 ) );

        return this._workDone;

    }

    get blockHash(){
        return this.hash;
    }

}

export default InterfaceBlockchainBlock;