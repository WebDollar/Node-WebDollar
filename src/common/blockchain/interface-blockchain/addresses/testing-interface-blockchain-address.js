
import InterfaceBlockchainAddress from 'common/blockchain/interface-blockchain/addresses/interface-blockchain-address'

function testAddressGenerator(){


    let privateKey = InterfaceBlockchainAddress._generatePrivateKeyAdvanced("123", true);
    let publicKey = InterfaceBlockchainAddress._generatePublicKey(privateKey.privateKeyWIF, true);

    let address = InterfaceBlockchainAddress._generateAddressFromPublicKey(publicKey, true);

}

exports.testAddressGenerator = testAddressGenerator;