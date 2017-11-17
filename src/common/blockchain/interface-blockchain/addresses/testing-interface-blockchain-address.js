
import {InterfaceBlockchainAddress} from './interface-blockchain-address'

function testAddressGenerator(){

    let address = new InterfaceBlockchainAddress();

    let privateKey = InterfaceBlockchainAddress._generatePrivateKeyAdvanced("123", true);
    InterfaceBlockchainAddress.generatePublicKey(privateKey.privateKey.hex, "hex", true);

}

exports.testAddressGenerator = testAddressGenerator;