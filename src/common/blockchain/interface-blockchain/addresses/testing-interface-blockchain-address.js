
import {InterfaceBlockchainAddress} from './interface-blockchain-address'

function testAddressGenerator(){

    let address = new InterfaceBlockchainAddress();

    let privateKey = InterfaceBlockchainAddress._generatePrivateKeyAdvanced("123", true);
    InterfaceBlockchainAddress._generatePublicKey(privateKey.privateKeyWIF, true);

}

exports.testAddressGenerator = testAddressGenerator;