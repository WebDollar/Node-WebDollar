
var assert = require('assert')


import InterfaceBlockchainAddress from 'common/blockchain/interface-blockchain/addresses/Interface-Blockchain-Address'
import InterfaceBlockchainAddressHelper from 'common/blockchain/interface-blockchain/addresses/Interface-Blockchain-Address-Helper'


describe('testAddressGenerator', () => {

    let privateKey  = null;
    it('should return privateKey', ()=>{
        privateKey = InterfaceBlockchainAddressHelper._generatePrivateKeyAdvanced("123", true);

        assert(typeof privateKey === 'object', 'Private Key is not an object')
        assert(privateKey !== null, 'Private Key is not an object')
    });

    let publicKey  = null;
    it('should return publicKey', ()=>{

        publicKey = InterfaceBlockchainAddressHelper._generatePublicKey(privateKey.privateKeyWIF, true);

        assert(typeof publicKey === 'object', 'Public Key is not an object');
        assert(publicKey !== null, 'Public Key is NOT NULL');
    })

    let address = null;
    it ('should return address', ()=>{
        address = InterfaceBlockchainAddressHelper._generateAddressFromPublicKey(publicKey, true);

        assert(typeof address === 'object', 'Address is not an object');
        assert(address !== null, 'Address is NOT NULL');
    })

    console.log(privateKey, publicKey, address)



    let blockchainAddress = new InterfaceBlockchainAddress();
    blockchainAddress.createNewAddress();

    blockchainAddress._toStringDebug()


});

