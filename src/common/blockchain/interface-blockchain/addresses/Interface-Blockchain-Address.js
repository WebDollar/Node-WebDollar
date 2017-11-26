import InterfaceBlockchainAddressHelper from './Interface-Blockchain-Address-Helper'

class InterfaceBlockchainAddress{


    constructor (){

        this.address = null;

        this.publicKey = null;
        this.privateKey = null;

    }

    createNewAddress(salt){


        if (this.address !== null){
            console.log("WARNING! You overwrite the initial address")
        }

        let result = InterfaceBlockchainAddressHelper.generateAddress(salt);

        this.address = result.address;
        this.publicKey = result.publicKey;
        this.privateKey = result.privateKey;

    }

    toString(){

        return this.address.toString()

    }


    _toStringDebug(){

        return "address" + this.address.toString() + (this.publicKey !== null ? "public key" + this.publicKey.toString() : '') + (this.privateKey !== null ? "private key" + this.privateKey.toString() : '')
    }




}

export default InterfaceBlockchainAddress;