import WebDollarCryptoData from 'common/crypto/Webdollar-Crypto-Data'

/*
    Tutorial based on https://en.bitcoin.it/wiki/Block_hashing_algorithm
 */

class InterfaceBlockchainBlock{


    constructor (){

        this.version = null; // 4 bytes

        this.prevHash = null; //32 bytes, sha256

        this.hash = null; // 256-bit hash based on all of the transactions in the block - 32 bytes, sha256

        this.nonce = null; //	32-bit number (starts at 0)-  int,                       4 bytes

        this.time = null; //Current timestamp as seconds since 1970-01-01T00:00 UTC   -  4 bytes,


        this.data = null; // transactions - data

    }

    validateBlock(){

        if (typeof this.data === 'undefined' || this.data === null) throw ('data is empty');
        if (typeof this.prevHash === 'undefined' || this.prevHash === null) throw ('prevHash is empty');
        if (typeof this.hash === 'undefined' || this.hash === null) throw ('hash is empty');
        if (typeof this.nonce === 'undefined' || this.nonce === null) throw ('nonce is empty');

        return true;
    }

    toString(){

        return this.hash.toString() + this.prevHash.toString() + JSON.stringify(this.data);

    }

    toJSON(){

        return {
            hash: this.hash,
            prevHash: this.prevHash,
            data: this.data,
        }

    }

    save(){

    }

    load(){

    }

}

export default InterfaceBlockchainBlock;