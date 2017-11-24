import InterfaceBlockchainAddressHelper from './interface-blockchain-address-helper'

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

        console.log(this.address)

    }


    _toStringDebug(){

        console.log("address", this.address, "public key", this.publicKey, "private key", this.privateKey )
    }




}

export default InterfaceBlockchainAddress;