
import {InterfaceBlockchainAddress} from './interface-blockchain-address'

function testAddressGenerator(){

    let address = new InterfaceBlockchainAddress();

    InterfaceBlockchainAddress.createAddress("123", true);

}

exports.testAddressGenerator = testAddressGenerator;