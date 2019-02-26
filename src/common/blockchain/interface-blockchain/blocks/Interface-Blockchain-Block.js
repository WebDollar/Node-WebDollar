/* eslint-disable */
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

    constructor (blockchain, blockValidation, version, hash, hashPrev, difficultyTargetPrev, hashChainPrev, timeStamp, nonce, data, height, db){

        this.blockchain = blockchain;

        this.version = version||0; // 2 bytes version                                                 - 2 bytes

        //prev information
        this.hashPrev = hashPrev;
        this.difficultyTargetPrev = difficultyTargetPrev;
        this.hashChainPrev = hashChainPrev||null; // 256-bit hash sha256    l                                         - 32 bytes, sha256

        //current information
        this.nonce = nonce||0;//	int 2^8^5 number (starts at 0)-  int,                              - 5 bytes
        this.hash = hash||null; // 256-bit hash based on all of the transactions in the block     - 32 bytes, sha256

        this.hashChain = null;
        this.difficultyTarget = null; // difficulty set by Blockchain

        this.height = (typeof height === "number" ? height : null); // index set by me

        if (!blockValidation )
            blockValidation = this.blockchain.createBlockValidation();

        this.blockValidation = blockValidation;

        this.timeStamp = timeStamp||null; //Current timestamp as seconds since 1970-01-01T00:00 UTC        - 4 bytes,

        if ( !data )
            data = this.blockchain.blockCreator.createEmptyBlockData();

        this.data = data;



        this.reward = undefined;

        this.db = db;

    }

    async getTimestampForMining(){

        let timeStamp = this.blockchain.timestamp.networkAdjustedTime - BlockchainGenesis.timeStampOffset;

        if (!timeStamp)
            timeStamp = ( new Date().getTime() - BlockchainGenesis.timeStampOffset) / 1000;

        timeStamp += Math.floor( Math.random()*5   );

        try {

            await this.blockchain.blocks.timestampBlocks.validateMedianTimestamp( timeStamp, this.height, this.blockValidation );

        } catch (exception){
            timeStamp = exception.medianTimestamp + 1;

            await this.blockchain.blocks.timestampBlocks.validateMedianTimestamp( timeStamp, this.height, this.blockValidation );
        }


        timeStamp = Math.ceil( timeStamp );

        return timeStamp

    }

    async _supplementaryValidation() {
        return true;
    }

    async validateBlock( height ){

        if (typeof this.version !== 'number') throw {message: 'version is empty'};
        if (typeof this.nonce !== 'number') throw {message: 'nonce is empty'};
        if (typeof this.timeStamp !== 'number') throw {message: 'timeStamp is empty'};

        if ( !this.hash || !Buffer.isBuffer(this.hash) ) throw {message: 'hash is empty'};
        if ( !this.hashPrev || !Buffer.isBuffer(this.hashPrev) ) throw {message: 'hashPrev is empty'};
        if ( !this.hashChainPrev || !Buffer.isBuffer(this.hashChainPrev) ) throw {message: 'hashChainPrev is empty'};

        //timestamp must be on 4 bytes
        if (this.timeStamp < 0 || this.timeStamp >= 0xFFFFFFFF) throw {message: 'timeStamp is invalid'};

        if (height >= 0) {
            if (this.version !== consts.TRANSACTIONS.VERSIONS.SCHNORR_VERSION) throw {message: 'invalid version ', version: this.version};
        }

        if (height !== this.height)
            throw {message: 'height is different', height: height, myHeight: this.height};

        if ( ! (await this._validateHash()) )
            throw {message: "validateBlockchain returned false"};

        await this._validateTargetDifficulty();

        await this._validateBlockTimeStamp();

        if (this.reward !== BlockchainMiningReward.getReward(this.height) )
            throw {message: 'reward is not right: ', myReward: this.reward, reward: BlockchainMiningReward.getReward( this.height ) };

        if ( await this._supplementaryValidation() === false)
            throw {message: "supplementaryValidation failed"};

        return true;
    }

    /**
     * it will recheck the validity of the block
     */
    async _validateHash() {

        if ( ! this.blockValidation.blockValidationType["skip-prev-hash-validation"] ){

            //validate hashPrev
            let previousHash = await this.blockValidation.getHashCallback(this.height-1);
            if ( !previousHash || !Buffer.isBuffer(previousHash))
                throw {message: 'previous hash is not given'};

            if (! BufferExtended.safeCompare(previousHash, this.hashPrev))
                throw {message: "block prevHash doesn't match ", hashPrev: previousHash.toString("hex"), blockHashPrev: this.hashPrev.toString("hex")};


        }

        //validate hash
        //skip the validation, if the blockValidationType is provided

        if (!this.blockValidation.blockValidationType['skip-validation-PoW-hash']) {

            let hash = await this.computeHash();

            if (! BufferExtended.safeCompare(hash, this.hash))
                throw {message: "block hash is not right", nonce: this.nonce, height: this.height, myHash:this.hash.toString("hex"), hash:hash.toString("hex"),
                    difficultyTargetPrev: this.difficultyTargetPrev.toString("hex"), serialization: Buffer.concat( [this._computeBlockHeaderPrefix(), Serialization.serializeNumber4Bytes(this.nonce)] ).toString("hex")};

        }

        if (! this.blockValidation.blockValidationType["skip-prev-hash-validation"] && this.height >= consts.BLOCKCHAIN.HARD_FORKS.POS_ACTIVATION){

            //validate hashChainPrev
            let prevBlockChainHash = await this.blockValidation.getChainHashCallback(this.height-1);

            if ( !prevBlockChainHash || !Buffer.isBuffer(prevBlockChainHash))
                throw {message: 'previous chain hash is not given'};

            if (! BufferExtended.safeCompare(prevBlockChainHash, this.hashChainPrev))
                throw {message: "block prevChainHash doesn't match ", prevBlockChainHash: prevBlockChainHash.toString("hex"), hashChainPrev: this.hashChainPrev.toString("hex")};

        }

        await this.data.validateBlockData(this.height, this.blockValidation);

        return true;

    }

    async _validateTargetDifficulty(){

        let prevDifficultyTarget = await this.blockValidation.getDifficultyCallback(this.height-1);

        if ( !prevDifficultyTarget || !Buffer.isBuffer(prevDifficultyTarget) )
            throw {message: 'previousDifficultyTarget is not given'};

        if (! this.difficultyTargetPrev.equals( prevDifficultyTarget ) )
            throw {message: 'previousDifficultyTarget is invalid'};

        if (! (this.hash.compare( prevDifficultyTarget ) <= 0))
            throw {message: "block doesn't match the difficulty target is not ", hash:this.hash, prevDifficultyTarget: prevDifficultyTarget};

        return true;
    }



    async _validateBlockTimeStamp(){

        // BITCOIN: A timestamp is accepted as valid if it is greater than the median timestamp of previous 11 blocks, and less than the network-adjusted time + 2 hours.

        if ( ! this.blockValidation.blockValidationType['skip-validation-timestamp'] && this.height > consts.BLOCKCHAIN.TIMESTAMP.VALIDATION_NO_BLOCKS + 1 )
            await this.blockchain.blocks.timestampBlocks.validateMedianTimestamp(this.timeStamp, this.height, this.blockValidation);

        if (!this.blockValidation.blockValidationType["skip-validation-timestamp-network-adjusted-time"])
            this.blockchain.blocks.timestampBlocks.validateNetworkAdjustedTime(this.timeStamp, this.height);

        return true;
    }

    toString(){
        return this.hashPrev.toString() + this.data.toString();
    }

    toJSON(){

        return {
            height: this.height,
            version: this.version,
            hashPrev: this.hashPrev ? this.hashPrev.toString("hex") : '',
            hashChainPrev: this.hashChainPrev ? this.hashChainPrev.toString("hex") : '',
            data: this.data ? this.data.toJSON() : '',
            nonce: this.nonce,
            timeStamp: this.timeStamp,
            difficulty: this.difficultyTarget ? this.difficultyTarget.toString("hex") : '',
            hash: this.hash.toString("hex"),
            hashChain: this.hashChain ? this.hashChain.toString("hex") : '',
        }

    }

    /*
        Concat of Hashes to avoid double computation
     */

    _computeBlockHeaderPrefix( requestHeader = false ){

        if (this.height < consts.BLOCKCHAIN.HARD_FORKS.TRANSACTIONS_INCLUDING_ONLY_HEADER && requestHeader )
            requestHeader = false;

        return Buffer.concat ( [

            Serialization.serializeNumber2Bytes( this.version ),
            Serialization.serializeToFixedBuffer( consts.BLOCKCHAIN.BLOCKS_POW_LENGTH , this.hashPrev ),
            Serialization.serializeNumber4Bytes( this.timeStamp ),
            (this.height > consts.BLOCKCHAIN.HARD_FORKS.POS_ACTIVATION) ? Serialization.serializeToFixedBuffer( consts.BLOCKCHAIN.BLOCKS_POW_LENGTH , this.hashChainPrev ) : new Buffer(0),
            //data contains addressMiner, transactions history, contracts, etc
            this.data.serializeData(requestHeader),

        ]);
    }


    /**
     * Computes block's hash
     * @param newNonce
     * @returns {Promise<Buffer>}
     */
    async computeHash(newNonce){
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

    // hash is hashPow ( block header + nonce )
    async computeHashPOW(newNonce){

        try {

            return WebDollarCrypto.hashPOW( this._getHashPOWData(newNonce) );

        } catch (exception){
            console.error("Error computeHash", exception);
            throw exception;
        }

    }




    /**
     * Computes a hash based on static block data
     * @param newNonce
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

    async serializeBlock( requestHeader = false ){

        // serialize block is ( hash + nonce + header )

        if (!Buffer.isBuffer(this.hash) || this.hash.length !== consts.BLOCKCHAIN.BLOCKS_POW_LENGTH)
            this.hash = await this.computeHash();

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

    deserializeBlock(buffer, height, reward, difficultyTargetPrev, offset = 0, blockLengthValidation = true, onlyHeader = false){

        if (!Buffer.isBuffer(buffer) && typeof buffer === "string")
            buffer = new Buffer(buffer, "hex");

        if ( height )  this.height = height||0;
        if (reward ) this.reward = reward;
        else this.reward = BlockchainMiningReward.getReward(this.height);

        if (difficultyTargetPrev ) this.difficultyTargetPrev = difficultyTargetPrev;

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

            if (height > consts.BLOCKCHAIN.HARD_FORKS.POS_ACTIVATION){
                this.hashChainPrev = BufferExtended.substr(buffer, offset, consts.BLOCKCHAIN.BLOCKS_POW_LENGTH);
                offset += consts.BLOCKCHAIN.BLOCKS_POW_LENGTH;
            } else
                this.hashChainPrev = this.hashPrev;

            offset = this.data.deserializeData(buffer, offset, onlyHeader);

        } catch (exception){
            console.error("error deserializing a block  ", exception, buffer);
            throw exception;
        }

        return offset;

    }

    async calculateDifficultyTarget(){
        this.difficultyTarget = await this.blockValidation.getDifficulty( this.timeStamp, this.height );
        this.difficultyTarget = Serialization.convertBigNumber(this.difficultyTarget, consts.BLOCKCHAIN.BLOCKS_POW_LENGTH);
    }

    async saveBlockDifficulty(){
        return this.db.save("blockDiff" + this.height, this.difficultyTarget);
    }

    async saveBlockHash(){
        return this.db.save("blockHash" + this.height, this.hash);
    }

    async saveBlockHashInversed() {
        return this.db.save('blockHashInversed' + this.hash.toString('hex'), this.height);
    }

    async saveBlockChainHash(){
        return this.db.save("blockChainHash" + this.height, this.hashChain);
    }

    async saveBlockTimestamp(){
        return this.db.save("blockTimestamp" + this.height, this.timeStamp);
    }

    async getChainWork(){

        let chainWork = await this.blockchain.blocks.loadingManager.getChainWork(this.height-1);
        chainWork = chainWork.plus( this.workDone);

        return chainWork;
    }

    async saveChainWork(){

        return this.db.save("chainWork"+this.height, Serialization.serializeBigInteger( await this.getChainWork() ) )
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

        let trials = 0, answer;
        while (trials < 20){

            answer = true;
            try{
                answer = answer && await this.db.save(key, bufferValue);
                answer = answer && await this.saveBlockDifficulty();
                answer = answer && await this.saveBlockHash();
                answer = answer && await this.saveBlockHashInversed();
                answer = answer && await this.saveBlockChainHash();
                answer = answer && await this.saveBlockTimestamp();
                answer = answer && await this.saveChainWork();

                await this.data.transactions.confirmTransactions(this.height, true);
            }
            catch (exception){
                console.error('ERROR on SAVE block: ',  exception);
                trials++;
            }

            if (answer)
                break;
        }


        return answer;
    }

    async loadBlock(){

        let key = "block" + this.height;

        try{

            let buffer = await this.db.get(key, 7000);

            if ( !buffer ) {
                console.error("block "+this.height+" was not found "+ key);
                return false;
            }

            this.deserializeBlock(buffer, this.height, undefined);

            if (!this.difficultyTarget)
                await this.calculateDifficultyTarget();

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
            return  this.db.remove(key);
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
            hashChain: this.hashChain,
            hashPrev: this.hashPrev,
            hashChainPrev: this.hashChainPrev,
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
        this.data.hashData = json.data.hashData;

        this.hashChainPrev = json.hashChainPrev;
        this.hashPrev = json.hashPrev;

        this.difficultyTargetPrev = json.difficultyTargetPrev;

        this.nonce = json.nonce;

        this.version = json.version;
        this.timeStamp = json.timeStamp;

        //calculate Hash
        this._computeBlockHeaderPrefix(true);
        await this.computeHash();

    }


    /**
     *
     */
    get workDone(){
        return consts.BLOCKCHAIN.BLOCKS_MAX_TARGET_BIG_INTEGER.divide( new BigInteger( this.difficultyTargetPrev.toString("hex"), 16 ) );
    }

    calculateChainHash(){
        return this.hash;
    }

}

export default InterfaceBlockchainBlock;
