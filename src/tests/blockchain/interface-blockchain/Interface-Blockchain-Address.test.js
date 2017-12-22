
var assert = require('assert')


import InterfaceBlockchainAddress from 'common/blockchain/interface-blockchain/addresses/Interface-Blockchain-Address'
import InterfaceBlockchainAddressHelper from 'common/blockchain/interface-blockchain/addresses/Interface-Blockchain-Address-Helper'
import WebDollarCryptoData from 'common/crypto/WebDollar-Crypto-Data'


describe('testAddressGenerator', () => {

    let privateKey  = null;
    it('should return privateKey', ()=>{
        privateKey =  InterfaceBlockchainAddressHelper._generatePrivateKeyAdvanced("123", true);

        assert (privateKey.privateKeyWIF, "privateKeyWIF doesn't exist")
        assert (privateKey.privateKey, "privateKey doesn't exist")

        assert(WebDollarCryptoData.isWebDollarCryptoData(privateKey.privateKey), 'Private Key privateKey is not an object')
        assert(WebDollarCryptoData.isWebDollarCryptoData(privateKey.privateKeyWIF), 'Private Key privateKeyWIF is not an object')
    });

    let publicKey  = null;
    it('should return publicKey', ()=>{

        publicKey = InterfaceBlockchainAddressHelper._generatePublicKey(privateKey.privateKeyWIF, true);

        assert(WebDollarCryptoData.isWebDollarCryptoData(publicKey), 'Public Key is not an object');
    })

    let address = null;
    it ('should return address', ()=>{
        address = InterfaceBlockchainAddressHelper._generateAddressFromPublicKey(publicKey, true);

        console.log("should return address", address);
        assert(WebDollarCryptoData.isWebDollarCryptoData(address), 'Address is not an object');
    })

    it ('blockchain address', ()=>{

        let blockchainAddress = new InterfaceBlockchainAddress();
        blockchainAddress.createNewAddress();

        console.log("new address", blockchainAddress.address, blockchainAddress.privateKey, blockchainAddress.publicKey)

        assert(WebDollarCryptoData.isWebDollarCryptoData(blockchainAddress.address), "blockChain Address")
        assert(WebDollarCryptoData.isWebDollarCryptoData(blockchainAddress.publicKey), "blockChain Public Key")
        assert(WebDollarCryptoData.isWebDollarCryptoData(blockchainAddress.privateKey.privateKeyWIF), "blockChain Private Key WIF")
        assert(WebDollarCryptoData.isWebDollarCryptoData(blockchainAddress.privateKey.privateKey), "blockChain Private Key")

        let stringDebug = blockchainAddress._toStringDebug()
        let string = blockchainAddress.toString()

        assert(typeof stringDebug === 'string', "Addresses Debug String returned is not string")
        assert(typeof string === 'string', "Addresses String returned is not string")

    })


});

