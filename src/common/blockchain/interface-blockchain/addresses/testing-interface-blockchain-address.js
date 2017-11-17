
import {InterfaceBlockchainAddress} from './interface-blockchain-address'

function testAddressGenerator(){

    let address = new InterfaceBlockchainAddress();

    let privateKey = InterfaceBlockchainAddress._getPrivateKeyAdvanced("123", true);
    InterfaceBlockchainAddress.getPublicKey(privateKey.privateKey.hex, "hex", true);

}

exports.testAddressGenerator = testAddressGenerator;