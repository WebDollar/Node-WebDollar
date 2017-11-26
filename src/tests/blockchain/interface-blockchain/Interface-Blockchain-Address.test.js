
var assert = require('assert')


import InterfaceBlockchainAddress from 'common/blockchain/interface-blockchain/addresses/Interface-Blockchain-Address'
import InterfaceBlockchainAddressHelper from 'common/blockchain/interface-blockchain/addresses/Interface-Blockchain-Address-Helper'
import WebDollarCryptData from 'common/crypto/Webdollar-Crypt-Data'


describe('testAddressGenerator', () => {

    let privateKey  = null;
    it('should return privateKey', ()=>{
        privateKey =  InterfaceBlockchainAddressHelper._generatePrivateKeyAdvanced("123", true);

        assert (privateKey.privateKeyWIF, "privateKeyWIF doesn't exist")
        assert (privateKey.privateKey, "privateKey doesn't exist")

        assert(WebDollarCryptData.isWebDollarCryptData(privateKey.privateKey), 'Private Key privateKey is not an object')
        assert(WebDollarCryptData.isWebDollarCryptData(privateKey.privateKeyWIF), 'Private Key privateKeyWIF is not an object')
    });

    let publicKey  = null;
    it('should return publicKey', ()=>{

        publicKey = InterfaceBlockchainAddressHelper._generatePublicKey(privateKey.privateKeyWIF, true);

        assert(WebDollarCryptData.isWebDollarCryptData(publicKey), 'Public Key is not an object');
    })

    let address = null;
    it ('should return address', ()=>{
        address = InterfaceBlockchainAddressHelper._generateAddressFromPublicKey(publicKey, true);

        assert(WebDollarCryptData.isWebDollarCryptData(address), 'Address is not an object');
    })

    it ('blockchain address', ()=>{

        let blockchainAddress = new InterfaceBlockchainAddress();
        blockchainAddress.createNewAddress();

        console.log("new address", blockchainAddress.address, blockchainAddress.privateKey, blockchainAddress.publicKey)

        assert(WebDollarCryptData.isWebDollarCryptData(blockchainAddress.address), "blockChain Address")
        assert(WebDollarCryptData.isWebDollarCryptData(blockchainAddress.publicKey), "blockChain Public Key")
        assert(WebDollarCryptData.isWebDollarCryptData(blockchainAddress.privateKey.privateKeyWIF), "blockChain Private Key WIF")
        assert(WebDollarCryptData.isWebDollarCryptData(blockchainAddress.privateKey.privateKey), "blockChain Private Key")

        let stringDebug = blockchainAddress._toStringDebug()
        let string = blockchainAddress.toString()

        assert(typeof stringDebug === 'string', "Addresses Debug String returned is not string")
        assert(typeof string === 'string', "Addresses String returned is not string")

    })


});

