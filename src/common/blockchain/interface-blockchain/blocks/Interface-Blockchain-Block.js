import WebDollarCryptoData from 'common/crypto/Webdollar-Crypto-Data'

class InterfaceBlockchainBlock{


    constructor (){

        this.hash = null;
        this.prevHash = null;
        this.data = null;

    }

    validateBlock(){

        if (typeof this.data === null || this.data === null) throw ('data is empty');
        if (typeof this.prevHash === null || this.prevHash === null) throw ('prevHash is empty');
        if (typeof this.hash === null || this.hash === null) throw ('hash is empty');

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