
import {InterfaceBlockchainAddress} from './interface-blockchain-address'

function testAddressGenerator(){

    let address = new InterfaceBlockchainAddress();

    InterfaceBlockchainAddress.getPrivateKey("123", true);
    InterfaceBlockchainAddress.getPublicKey("123", true);

}

exports.testAddressGenerator = testAddressGenerator;