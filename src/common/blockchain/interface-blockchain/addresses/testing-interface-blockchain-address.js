
import InterfaceBlockchainAddress from 'common/blockchain/interface-blockchain/addresses/interface-blockchain-address'
import InterfaceBlockchainAddressFunctions from 'common/blockchain/interface-blockchain/addresses/interface-blockchain-address-functions'

class TestingInterfaceBlockchainAddress{

    testAddressGenerator(){

        let privateKey = InterfaceBlockchainAddressFunctions._generatePrivateKeyAdvanced("123", true);
        let publicKey = InterfaceBlockchainAddressFunctions._generatePublicKey(privateKey.privateKeyWIF, true);

        let address = InterfaceBlockchainAddressFunctions._generateAddressFromPublicKey(publicKey, true);




        console.log(privateKey, publicKey, address)

        let blockchainAddress = new InterfaceBlockchainAddress();
        blockchainAddress.createAddress();

        blockchainAddress._toStringDebug()

    }

};

export default  new TestingInterfaceBlockchainAddress()