
import InterfaceBlockchainAddress from 'common/blockchain/interface-blockchain/addresses/interface-blockchain-address'
import InterfaceBlockchainAddressHelper from 'common/blockchain/interface-blockchain/addresses/interface-blockchain-address-helper'

class TestingInterfaceBlockchainAddress{

    testAddressGenerator(){

        let privateKey = InterfaceBlockchainAddressHelper._generatePrivateKeyAdvanced("123", true);
        let publicKey = InterfaceBlockchainAddressHelper._generatePublicKey(privateKey.privateKeyWIF, true);

        let address = InterfaceBlockchainAddressHelper._generateAddressFromPublicKey(publicKey, true);




        console.log(privateKey, publicKey, address)

        let blockchainAddress = new InterfaceBlockchainAddress();
        blockchainAddress.createNewAddress();

        blockchainAddress._toStringDebug()

    }

};

export default  new TestingInterfaceBlockchainAddress()