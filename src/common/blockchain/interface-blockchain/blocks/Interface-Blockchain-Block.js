var BigInteger = require('big-integer');
import WebDollarCryptoData from 'common/crypto/Webdollar-Crypto-Data'
import WebDollarCrypto from 'common/crypto/WebDollar-Crypto'
import BlockchainGenesis from 'common/blockchain/interface-blockchain/blocks/Blockchain-Genesis'
import consts from 'consts/const_global'
import InterfacePouchDB from 'common/pouchdb/Interface-PouchDB'

/*
    Tutorial based on https://en.bitcoin.it/wiki/Block_hashing_algorithm
 */
class InterfaceBlockchainBlock{

    //everything is buffer

    constructor (version, hash, hashPrev, hashData, timeStamp, nonce, data, height, db){

        this.version = version||null; // 2 bytes version                                                 - 2 bytes

        this.hash = hash||null; // 256-bit hash based on all of the transactions in the block     - 32 bytes, sha256

        this.hashPrev = hashPrev||null; // 256-bit hash sha256                                             - 32 bytes, sha256

        if ( hashData === undefined){
            hashData = WebDollarCrypto.SHA256 ( WebDollarCrypto.SHA256( WebDollarCryptoData.createWebDollarCryptoData(data, true) )).buffer;
        }

        this.hashData = hashData||null; // 256-bit hash based on all of the transactions in the block     - 32 bytes, sha256

        this.nonce = nonce||0;//	int 2^8^5 number (starts at 0)-  int,                              - 5 bytes
        
        if ( timeStamp === undefined){

            timeStamp = Math.floor( new Date().getTime() / 1000 ) - BlockchainGenesis.timeStamp;
        }

        this.timeStamp = timeStamp||null; //Current timestamp as seconds since 1970-01-01T00:00 UTC        - 4 bytes,

        this.data = data||{}; // transactions - data


        //computed data
        this.computedBlockPrefix = null;

        this.difficultyTarget = null; // difficulty set by me
        this.height = (typeof height === "number" ? height : null); // index set by me

        this.db = db;
    }

    async validateBlock(height, previousDifficultyTarget, previousHash){

        if (this.version === undefined || this.version === null || typeof this.version !== 'number') throw ('version is empty');

        if (this.hash === undefined || this.hash === null || !Buffer.isBuffer(this.hash) ) throw ('hash is empty');
        if (this.hashPrev === undefined || this.hashPrev === null || !Buffer.isBuffer(this.hashPrev) ) throw ('hashPrev is empty');

        if (this.data === undefined || this.data === null  ) throw ('data is empty');
        if (this.data.minerAddress === undefined || this.data.minerAddress === null  ) throw ('data.minerAddress is empty');

        if (this.hashData === undefined || this.hashData === null || !Buffer.isBuffer(this.hashData)) throw ('hashData is empty');

        if (this.nonce === undefined || this.nonce === null || typeof this.nonce !== 'number') throw ('nonce is empty');
        if (this.timeStamp === undefined || this.timeStamp === null || typeof this.timeStamp !== 'number') throw ('timeStamp is empty');

        //timestamp must be on 4 bytes
        this.timeStamp = Math.floor(this.timeStamp);
        if (this.timeStamp >= 0xFFFFFFFF) throw ('timeStamp is invalid');

        if (height >=0)
            if (this.version !== 0x01) throw ('invalid version');

        if (height !== this.height) throw 'height is different';

        await this._validateBlockHash(previousHash);
        this._validateTargetDifficulty(previousDifficultyTarget);

        return true;
    }

    /**
     * it will recheck the validity of the block
     */
    async _validateBlockHash(previousHash) {

        if (this.computedBlockPrefix === null) this._computeBlockHeaderPrefix(); //making sure that the prefix was calculated for calculating the block

        //validate hashPrev
        if ( previousHash === null || (!Buffer.isBuffer(previousHash) && !WebDollarCryptoData.isWebDollarCryptoData(previousHash)) ) throw 'previous hash is not given'

        if (! previousHash.equals(this.hashPrev)) throw "block prevHash doesn't match";


        //validate hash
        let hash = await this.computeHash();

        if (!hash.equals(this.hash)) throw "block hash is not right";

    }

    _validateTargetDifficulty(prevDifficultyTarget){


        if (prevDifficultyTarget instanceof BigInteger) prevDifficultyTarget = WebDollarCryptoData.createWebDollarCryptoData(prevDifficultyTarget).toFixedBuffer(consts.BLOCKS_POW_LENGTH);

        if ( prevDifficultyTarget === null || (!Buffer.isBuffer(prevDifficultyTarget) && !WebDollarCryptoData.isWebDollarCryptoData(prevDifficultyTarget)) ) throw 'previousDifficultyTarget is not given'

        //console.log("difficulty block",this.height, "diff", prevDifficultyTarget.toString("hex"), "hash", this.hash.toString("hex"));

        if (! (this.hash.compare( prevDifficultyTarget ) <= 0))
            throw "block doesn't match the difficulty target is not ";

        return true;
    }

    toString(){

        return this.hashData.toString() + this.hashPrev.toString() + JSON.stringify(this.data);

    }

    toJSON(){

        return {
            version: this.version,
            hashPrev: this.hashPrev,
            hashData: this.hashData,
            data: this.data,
            nonce: this.nonce,
            timeStamp: this.timeStamp,
        }

    }

    /*
        Concat of Hashes to avoid double computation
     */

    _computeBlockHeaderPrefix(skip){

        //in case I have calculated  the computedBlockPrefix before

        if (skip === true && Buffer.isBuffer(this.computedBlockPrefix) ){
            return this.computedBlockPrefix;
        }

        this.computedBlockPrefix = Buffer.concat ( [
                                                     WebDollarCryptoData.createWebDollarCryptoData( this.version).toFixedBuffer(2),
                                                     WebDollarCryptoData.createWebDollarCryptoData( this.hashPrev ).toFixedBuffer( consts.BLOCKS_POW_LENGTH ),
                                                     WebDollarCryptoData.createWebDollarCryptoData( this.timeStamp ).toFixedBuffer( 4 ),
                                                     //data contains addressMiner, transactions history, contracts, etc
                                                     this._serializeData(),
                                                    ]);

        return this.computedBlockPrefix;
    }

    /**
        convert data to Buffer
     **/
    _serializeData(){

        let buffer = Buffer.concat( [
                                        WebDollarCryptoData.createWebDollarCryptoData( this.data.minerAddress ).toFixedBuffer(consts.PUBLIC_ADDRESS_LENGTH)
                                    ] )
        return buffer;
    }

    _deserializeData(buffer){

        let data = WebDollarCryptoData.createWebDollarCryptoData(buffer);

        let offset = 0;
        this.data = {};

        this.data.minerAddress = data.substr(offset, consts.PUBLIC_ADDRESS_LENGTH).buffer;
        offset += consts.PUBLIC_ADDRESS_LENGTH;

        return buffer;
    }

    computeHash(newNonce){

        // hash is hashPow ( block header + nonce )

        let buffer = Buffer.concat ( [
                                       this.computedBlockPrefix,
                                       WebDollarCrypto.convertNumberTo4BytesBuffer( newNonce||this.nonce ),
                                     ] );

        return WebDollarCrypto.hashPOW(buffer);
    }

    serializeBlock(){

        // serialize block is ( hash + nonce + header )

        this._computeBlockHeaderPrefix(true);
        let buffer = Buffer.concat( [
                                      this.hash,
                                      WebDollarCrypto.convertNumberTo4BytesBuffer( this.nonce ),
                                      this.computedBlockPrefix,
                                    ]);

        return buffer;

    }

    deserializeBlock(buffer, height){

        let data = WebDollarCryptoData.createWebDollarCryptoData(buffer);
        let offset = 0;

        if (height >= 0){

            this.hash = data.substr(0, consts.BLOCKS_POW_LENGTH).buffer;
            offset+=consts.BLOCKS_POW_LENGTH;
            
            this.nonce = data.substr(offset, consts.BLOCKS_NONCE).toInt();
            offset+=consts.BLOCKS_NONCE;
            
            this.version = data.substr(offset, 2).toInt();
            offset+=2;
            
            this.hashPrev = data.substr(offset, consts.BLOCKS_POW_LENGTH).buffer;
            offset+=consts.BLOCKS_POW_LENGTH;
            
            this.timeStamp = data.substr(offset, 4).toInt();
            offset+=4;

            this._deserializeData(data.substr(offset));
        }

    }

    save(){

        let key = "block" + this.height;
        let bufferValue = this.serializeBlock();
    
        return this.db.save(key, bufferValue).catch((err) => {
            throw 'ERROR on SAVE block: ' + err;
        });
    }

    load(){

        let key = "block" + this.height;

        return this.db.get(key).then((buffer) => {            
            this.deserializeBlock(buffer, this.height);
        }).catch((err) => {
            throw 'ERROR on LOAD block: ' + err;
        });
    }

}

export default InterfaceBlockchainBlock;