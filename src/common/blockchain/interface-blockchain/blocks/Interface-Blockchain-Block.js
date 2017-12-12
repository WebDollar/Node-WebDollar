import WebDollarCryptoData from 'common/crypto/Webdollar-Crypto-Data'
import WebDollarCrypto from 'common/crypto/WebDollar-Crypto'

/*
    Tutorial based on https://en.bitcoin.it/wiki/Block_hashing_algorithm
 */

class InterfaceBlockchainBlock{

    //everything is buffer

    constructor (){

        this.version = null; // 2 bytes version                                                 - 2 bytes

        this.hashPrev = null; // 256-bit hash sha256                                             - 32 bytes, sha256

        this.hashData = null; // 256-bit hash based on all of the transactions in the block     - 32 bytes, sha256

        this.nonce = null; //	int 64 number (starts at 0)-  int,                              - 8 bytes

        this.timeStamp = null; //Current timestamp as seconds since 1970-01-01T00:00 UTC        - 4 bytes,

        this.data = null; // transactions - data

        this.computedBlockPrefix = null;
    }

    validateBlock(index){

        if (typeof this.version === 'undefined' || this.version === null) throw ('version is empty');

        if (typeof this.hashPrev === 'undefined' || this.hashPrev === null) throw ('hashPrev is empty');
        if (typeof this.data === 'undefined' || this.data === null) throw ('data is empty');
        if (typeof this.hashData === 'undefined' || this.hashData === null) throw ('hashData is empty');

        if (typeof this.nonce === 'undefined' || this.nonce === null) throw ('nonce is empty');
        if (typeof this.timeStamp === 'undefined' || this.timeStamp === null) throw ('timeStamp is empty');

        if (index >=0)
            if (this.version !== 0x01) throw ('invalid version');

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

    calculateBlockPrefix(){

        this.computedBlockPrefix = Buffer.concat ( [ this.version, this.hashPrev, this.hashData,  this.timeStamp,  ])

    }

    hash(newNonce){

        let buffer;
        buffer = Buffer.concat ( [ this.computedBlockPrefix, newNonce||this.nonce] );

        return WebDollarCrypto.hashPOW(buffer);

    }

    save(){

    }

    load(){

    }

}

export default InterfaceBlockchainBlock;