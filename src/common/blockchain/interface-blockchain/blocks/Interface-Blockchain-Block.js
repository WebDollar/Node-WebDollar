import WebDollarCryptoData from 'common/crypto/Webdollar-Crypto-Data'
import WebDollarCrypto from 'common/crypto/WebDollar-Crypto'
import BlockchainGenesis from 'common/blockchain/interface-blockchain/blocks/Blockchain-Genesis'
import consts from 'consts/const_global'

/*
    Tutorial based on https://en.bitcoin.it/wiki/Block_hashing_algorithm
 */

class InterfaceBlockchainBlock{

    //everything is buffer

    constructor (version, hash, hashPrev, hashData, timeStamp, nonce, data, myHeight ){

        this.version = version||null; // 2 bytes version                                                 - 2 bytes

        this.hash = hash||null; // 256-bit hash based on all of the transactions in the block     - 32 bytes, sha256

        this.hashPrev = hashPrev||null; // 256-bit hash sha256                                             - 32 bytes, sha256

        if (typeof hashData === 'undefined'){
            hashData = WebDollarCrypto.SHA256 ( WebDollarCrypto.SHA256( WebDollarCryptoData.createWebDollarCryptoData(data, true) ));
        }

        this.hashData = hashData||null; // 256-bit hash based on all of the transactions in the block     - 32 bytes, sha256

        this.nonce = nonce||null; //	int 2^8^5 number (starts at 0)-  int,                              - 5 bytes

        if (typeof timeStamp === 'undefined'){
            timeStamp = new Date().getTime() - BlockchainGenesis.timeStamp;
        }

        this.timeStamp = timeStamp||null; //Current timestamp as seconds since 1970-01-01T00:00 UTC        - 4 bytes,

        this.data = null; // transactions - data

        this.computedBlockPrefix = null;

        this.myDifficultyTarget = null; // difficulty set by me
        this.myHeight = null; // index set by me
    }

    validateBlock(height, previousDifficultyTarget, previousHash){

        if (typeof this.version === 'undefined' || this.version === null || typeof this.version !== 'number') throw ('version is empty');

        if (typeof this.hash === 'undefined' || this.hash === null || !Buffer.isBuffer(this.hash) ) throw ('hash is empty');
        if (typeof this.hashPrev === 'undefined' || this.hashPrev === null || !Buffer.isBuffer(this.hashPrev) ) throw ('hashPrev is empty');

        if (typeof this.data === 'undefined' || this.data === null  ) throw ('data is empty');
        if (typeof this.hashData === 'undefined' || this.hashData === null || !Buffer.isBuffer(this.hashData)) throw ('hashData is empty');

        if (typeof this.nonce === 'undefined' || this.nonce === null || typeof this.nonce !== 'number') throw ('nonce is empty');
        if (typeof this.timeStamp === 'undefined' || this.timeStamp === null || typeof this.timeStamp !== 'number') throw ('timeStamp is empty');

        if (height >=0)
            if (this.version !== 0x01) throw ('invalid version');

        if (height !== this.myHeight) throw 'height is different';

        this.validateHash(previousHash);
        this.validateTargetDifficulty(previousDifficultyTarget);

        return true;
    }

    /**
     * it will recheck the validity of the block
     */
    validateHash(previousHash) {

        let hash = this.computeHash();

        if (hash.equals(this.hash) ) throw "block hash is not right";

        if ( previousHash === null || (!Buffer.isBuffer(previousHash) && !WebDollarCryptoData.isWebDollarCryptoData(previousHash)) ) throw 'previous hash is not given'

        if (previousHash.equals(this.hashPrev)) throw "block prevHash doesn't match";

    }

    validateTargetDifficulty(previousDifficultyTarget){

        if ( previousDifficultyTarget === null || (!Buffer.isBuffer(previousDifficultyTarget) && !WebDollarCryptoData.isWebDollarCryptoData(previousDifficultyTarget)) ) throw 'previousDifficultyTarget is not given'

        if (this.hash.compare( previousDifficultyTarget ) <= 0)
            throw "block doesn't match the difficulty target is not ";
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

    calculateBlockHeaderPrefix(){

        this.computedBlockPrefix = Buffer.concat ( [ WebDollarCryptoData.createWebDollarCryptoData( this.version).toFixedBuffer(2),
                                                     WebDollarCryptoData.createWebDollarCryptoData( this.hashPrev ).toFixedBuffer( consts.BLOCKS_POW_LENGTH ),
                                                     WebDollarCryptoData.createWebDollarCryptoData( this.hashData ).buffer,
                                                     WebDollarCryptoData.createWebDollarCryptoData( this.timeStamp ).toFixedBuffer( 4 )
                                                    ])

    }

    computeHash(newNonce){

        let buffer;
        buffer = Buffer.concat ( [ this.computedBlockPrefix, WebDollarCryptoData.createWebDollarCryptoData( newNonce||this.nonce).toFixedBuffer( consts.BLOCKS_POW_LENGTH ) ] );

        return WebDollarCrypto.hashPOW(buffer);

    }

    save(){

    }

    load(){

    }

}

export default InterfaceBlockchainBlock;